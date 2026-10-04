import { prisma } from "@/lib/prisma";
import { BookingStatus, SlotStatus } from "@prisma/client";
import { isWithinThreeHours } from "@/lib/timezone";
import { generateSessionToken, hashToken } from "@/lib/crypto";
import { smsService } from "./sms.service";

export interface CanUserBookParams {
  phone: string;
  userId?: string;
  requestedDate: string;
  requestedStartTime: string;
  excludeBookingId?: string;
}

export interface CreateBookingParams {
  serviceIds: string[];
  date: string;
  slotId: string;
  guestName: string;
  guestPhone: string;
  guestRealPhone: string;
  notes?: string;
  userId?: string;
  locale?: string;
}

export class BookingService {
  /**
   * Enforces the 3-Hour Booking Rule server-side.
   * One person cannot have more than one booking within a 3-hour window.
   */
  async canUserBook(params: CanUserBookParams): Promise<{
    allowed: boolean;
    reason?: string;
    conflictingBooking?: {
      id: string;
      date: string;
      startTime: string;
      bookingNumber: string;
    };
  }> {
    const { phone, userId, requestedDate, requestedStartTime, excludeBookingId } = params;

    // Look for active bookings for this user or phone
    const existingBookings = await prisma.booking.findMany({
      where: {
        id: excludeBookingId ? { not: excludeBookingId } : undefined,
        status: BookingStatus.CONFIRMED,
        OR: [
          { guestPhone: phone },
          ...(userId ? [{ userId }] : []),
        ],
      },
      select: {
        id: true,
        date: true,
        startTime: true,
        bookingNumber: true,
      },
    });

    // If the user/phone already has ANY active booking, they cannot book another slot.
    // They must cancel or reschedule their existing appointment.
    if (existingBookings.length > 0) {
      return {
        allowed: false,
        reason: "ACTIVE_BOOKING_EXISTS",
        conflictingBooking: existingBookings[0],
      };
    }

    return { allowed: true };
  }

  /**
   * Atomically reserves a slot and creates a booking pending SMS verification.
   * Prevents double-booking via database transactional checks.
   */
  async createBooking(params: CreateBookingParams) {
    const { serviceIds, date, slotId, guestName, guestPhone, guestRealPhone, notes, userId, locale = "hy" } = params;

    // 1. Fetch and validate Services
    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds }, active: true },
    });
    if (services.length === 0) {
      throw new Error("SELECTED_SERVICE_NOT_FOUND");
    }

    const totalDuration = services.reduce((acc, s) => acc + s.durationMinutes, 0);
    const totalPrice = services.reduce((acc, s) => acc + s.priceMinorUnits, 0);

    // 3. Check 3-Hour Booking Rule
    const slotRecord = await prisma.availabilitySlot.findUnique({
      where: { id: slotId },
      include: { availabilityDay: true },
    });

    if (!slotRecord) {
      throw new Error("INVALID_SLOT_SELECTION");
    }

    const bookingDate = slotRecord.availabilityDay?.date || date;

    const checkRule = await this.canUserBook({
      phone: guestPhone,
      userId,
      requestedDate: bookingDate,
      requestedStartTime: slotRecord.startTime,
    });

    if (!checkRule.allowed) {
      const error = new Error(checkRule.reason || "ACTIVE_BOOKING_EXISTS");
      (error as unknown as { conflictingBooking: unknown }).conflictingBooking = checkRule.conflictingBooking;
      throw error;
    }

    // 4. Generate guaranteed unique human-readable booking number & secure session token
    let bookingNumber = `BK-${Date.now().toString().slice(-4)}${Math.floor(1000 + Math.random() * 9000)}`;
    while (await prisma.booking.findUnique({ where: { bookingNumber } })) {
      bookingNumber = `BK-${Date.now().toString().slice(-4)}${Math.floor(1000 + Math.random() * 9000)}`;
    }
    const sessionToken = generateSessionToken();
    const sessionTokenHash = hashToken(sessionToken);

    // 5. Atomic Transaction to lock the slot and create booking
    const booking = await prisma.$transaction(async (tx) => {
      const currentSlot = await tx.availabilitySlot.findUnique({
        where: { id: slotId },
        include: { availabilityDay: true },
      });

      if (!currentSlot || currentSlot.status !== SlotStatus.AVAILABLE) {
        throw new Error("SLOT_ALREADY_RESERVED");
      }

      const slotsNeeded = Math.ceil(totalDuration / 15);
      
      const day = await tx.availabilityDay.findUnique({
        where: { date: bookingDate },
        include: {
          slots: {
            where: { status: SlotStatus.AVAILABLE, startTime: { gte: currentSlot.startTime } },
            orderBy: { startTime: 'asc' },
            take: slotsNeeded
          }
        }
      });
      
      if (!day || day.slots.length < slotsNeeded) {
        throw new Error("SLOT_ALREADY_RESERVED");
      }
      
      for (let i = 1; i < slotsNeeded; i++) {
          const prev = day.slots[i-1].startTime;
          const curr = day.slots[i].startTime;
          const [pH, pM] = prev.split(":").map(Number);
          const [cH, cM] = curr.split(":").map(Number);
          if (pH * 60 + pM + 15 !== cH * 60 + cM) {
              throw new Error("SLOT_ALREADY_RESERVED");
          }
      }

      await tx.availabilitySlot.updateMany({
        where: { id: { in: day.slots.map(s => s.id) } },
        data: { status: SlotStatus.HELD }
      });

      const endTimeCalc = (() => {
        const [h, m] = currentSlot.startTime.split(":").map(Number);
        const endMins = h * 60 + m + totalDuration;
        return `${Math.floor(endMins / 60).toString().padStart(2, "0")}:${(endMins % 60).toString().padStart(2, "0")}`;
      })();

      const createdBooking = await tx.booking.create({
        data: {
          bookingNumber,
          userId,
          guestName,
          guestPhone,
          guestRealPhone,
          notes: notes || null,
          sessionTokenHash,
          date: bookingDate,
          startTime: currentSlot.startTime,
          endTime: endTimeCalc,
          totalDurationMinutes: totalDuration,
          totalPriceMinorUnits: totalPrice,
          status: BookingStatus.CONFIRMED,
          locale: locale,
          slots: { connect: day.slots.map(s => ({ id: s.id })) },
          items: {
            create: services.map(s => ({
              itemType: "SERVICE",
              serviceId: s.id,
              nameSnapshot: s.nameHy,
              priceSnapshotMinor: s.priceMinorUnits,
              durationSnapshotMin: s.durationMinutes,
            })),
          },
        },
        include: {
          items: true,
          slots: true,
        },
      });

      return createdBooking;
    });

    // 6. Send SMS verification code
    // await smsService.sendVerificationCode(booking.id, guestPhone, locale);

    return {
      booking,
      sessionToken,
      verificationRequired: false,
    };
  }

  /**
   * Finds active booking by session token hash (for returning guest users).
   */
  async getActiveBookingBySessionToken(sessionToken: string) {
    const hashed = hashToken(sessionToken);
    return prisma.booking.findFirst({
      where: {
        sessionTokenHash: hashed,
        status: BookingStatus.CONFIRMED,
      },
      include: {
        items: true,
        slots: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Reschedules an existing booking to a new slot transactionally.
   */
  async rescheduleBooking(
    bookingId: string,
    newSlotId: string,
    newDate: string,
    sessionTokenOrUserId: string
  ) {
    const hashedToken = hashToken(sessionTokenOrUserId);

    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        status: BookingStatus.CONFIRMED,
        OR: [
          { sessionTokenHash: hashedToken },
          { userId: sessionTokenOrUserId },
        ],
      },
      include: { slots: true },
    });

    if (!booking) {
      throw new Error("BOOKING_NOT_FOUND_OR_UNAUTHORIZED");
    }

    const newSlot = await prisma.availabilitySlot.findUnique({
      where: { id: newSlotId },
      include: { availabilityDay: true },
    });

    if (!newSlot || newSlot.availabilityDay.date !== newDate || newSlot.status !== SlotStatus.AVAILABLE) {
      throw new Error("NEW_SLOT_UNAVAILABLE");
    }

    // Check 3-hour rule on the new time
    const checkRule = await this.canUserBook({
      phone: booking.guestPhone,
      userId: booking.userId || undefined,
      requestedDate: newDate,
      requestedStartTime: newSlot.startTime,
      excludeBookingId: booking.id,
    });

    if (!checkRule.allowed) {
      throw new Error("THREE_HOUR_RESTRICTION");
    }

    // Transactional slot swap
    return prisma.$transaction(async (tx) => {
      const slotsNeeded = Math.ceil(booking.totalDurationMinutes / 15);
      
      const day = await tx.availabilityDay.findUnique({
          where: { date: newDate },
          include: {
            slots: {
              where: { status: SlotStatus.AVAILABLE, startTime: { gte: newSlot.startTime } },
              orderBy: { startTime: 'asc' },
              take: slotsNeeded
            }
          }
      });
      
      if (!day || day.slots.length < slotsNeeded) {
          throw new Error("NEW_SLOT_UNAVAILABLE");
      }
      for (let i = 1; i < slotsNeeded; i++) {
           const prev = day.slots[i-1].startTime;
           const curr = day.slots[i].startTime;
           const [pH, pM] = prev.split(":").map(Number);
           const [cH, cM] = curr.split(":").map(Number);
           if (pH * 60 + pM + 15 !== cH * 60 + cM) {
               throw new Error("NEW_SLOT_UNAVAILABLE");
           }
      }

      // Release old slots
      if (booking.slots && booking.slots.length > 0) {
        await tx.availabilitySlot.updateMany({
          where: { id: { in: booking.slots.map(s => s.id) } },
          data: { status: SlotStatus.AVAILABLE },
        });
      }

      // Reserve new slots
      await tx.availabilitySlot.updateMany({
        where: { id: { in: day.slots.map(s => s.id) } },
        data: { status: SlotStatus.BOOKED },
      });

      const newEndTime = day.slots[day.slots.length - 1].endTime;

      // Update booking
      return tx.booking.update({
        where: { id: booking.id },
        data: {
          slots: {
              disconnect: booking.slots ? booking.slots.map(s => ({ id: s.id })) : [],
              connect: day.slots.map(s => ({ id: s.id }))
          },
          date: newDate,
          startTime: newSlot.startTime,
          endTime: newEndTime,
        },
        include: {
          items: true,
          slots: true,
        },
      });
    });
  }

  /**
   * Cancels a booking and releases the slot.
   */
  async cancelBooking(bookingId: string, sessionTokenOrUserId: string, reason?: string) {
    const hashedToken = hashToken(sessionTokenOrUserId);

    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING_VERIFICATION] },
        OR: [
          { sessionTokenHash: hashedToken },
          { userId: sessionTokenOrUserId },
        ],
      },
      include: { slots: true },
    });

    if (!booking) {
      throw new Error("BOOKING_NOT_FOUND_OR_UNAUTHORIZED");
    }

    return prisma.$transaction(async (tx) => {
      if (booking.slots && booking.slots.length > 0) {
        await tx.availabilitySlot.updateMany({
          where: { id: { in: booking.slots.map(s => s.id) } },
          data: { status: SlotStatus.AVAILABLE },
        });
      }

      return tx.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.CANCELLED,
          cancellationReason: reason || "User requested cancellation",
          slots: { set: [] },
        },
      });
    });
  }
}

export const bookingService = new BookingService();
