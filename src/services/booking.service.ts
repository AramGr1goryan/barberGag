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
  serviceId: string;
  addonIds: string[];
  date: string;
  slotId: string;
  guestName: string;
  guestPhone: string;
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
        status: {
          in: [BookingStatus.CONFIRMED, BookingStatus.PENDING_VERIFICATION],
        },
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
    const { serviceId, addonIds, date, slotId, guestName, guestPhone, userId, locale = "hy" } = params;

    // 1. Fetch and validate Service
    const service = await prisma.service.findUnique({
      where: { id: serviceId, active: true },
    });
    if (!service) {
      throw new Error("SELECTED_SERVICE_NOT_FOUND");
    }

    // 2. Fetch and validate Addons
    const addons = addonIds.length > 0
      ? await prisma.addon.findMany({
          where: { id: { in: addonIds }, active: true },
        })
      : [];

    const totalDuration = service.durationMinutes + addons.reduce((acc, a) => acc + a.durationMinutes, 0);
    const totalPrice = service.priceMinorUnits + addons.reduce((acc, a) => acc + a.priceMinorUnits, 0);

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
      // Re-fetch slot inside transaction with status check
      const currentSlot = await tx.availabilitySlot.findUnique({
        where: { id: slotId },
      });

      if (!currentSlot || currentSlot.status !== SlotStatus.AVAILABLE) {
        throw new Error("SLOT_ALREADY_RESERVED");
      }

      // Mark slot as HELD pending verification
      await tx.availabilitySlot.update({
        where: { id: slotId },
        data: {
          status: SlotStatus.HELD,
          version: { increment: 1 },
        },
      });

      // Free up any previous cancelled/unverified booking holding this slotId (prevents unique constraint error)
      await tx.booking.updateMany({
        where: { slotId: currentSlot.id },
        data: { slotId: null },
      });

      // Create Booking record
      const createdBooking = await tx.booking.create({
        data: {
          bookingNumber,
          userId,
          guestName,
          guestPhone,
          sessionTokenHash,
          date: bookingDate,
          startTime: currentSlot.startTime,
          endTime: currentSlot.endTime,
          totalDurationMinutes: totalDuration,
          totalPriceMinorUnits: totalPrice,
          status: BookingStatus.PENDING_VERIFICATION,
          slotId: currentSlot.id,
          items: {
            create: [
              {
                itemType: "SERVICE",
                serviceId: service.id,
                nameSnapshot: service.nameHy,
                priceSnapshotMinor: service.priceMinorUnits,
                durationSnapshotMin: service.durationMinutes,
              },
              ...addons.map((a) => ({
                itemType: "ADDON",
                addonId: a.id,
                nameSnapshot: a.nameHy,
                priceSnapshotMinor: a.priceMinorUnits,
                durationSnapshotMin: a.durationMinutes,
              })),
            ],
          },
        },
        include: {
          items: true,
          slot: true,
        },
      });

      return createdBooking;
    });

    // 6. Send SMS verification code
    await smsService.sendVerificationCode(booking.id, guestPhone, locale);

    return {
      booking,
      sessionToken,
      verificationRequired: true,
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
        status: {
          in: [BookingStatus.CONFIRMED, BookingStatus.PENDING_VERIFICATION],
        },
      },
      include: {
        items: true,
        slot: true,
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
      // Release old slot
      if (booking.slotId) {
        await tx.availabilitySlot.update({
          where: { id: booking.slotId },
          data: { status: SlotStatus.AVAILABLE },
        });
      }

      // Reserve new slot
      await tx.availabilitySlot.update({
        where: { id: newSlotId },
        data: { status: SlotStatus.BOOKED },
      });

      // Update booking
      return tx.booking.update({
        where: { id: booking.id },
        data: {
          slotId: newSlotId,
          date: newDate,
          startTime: newSlot.startTime,
          endTime: newSlot.endTime,
        },
        include: {
          items: true,
          slot: true,
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
    });

    if (!booking) {
      throw new Error("BOOKING_NOT_FOUND_OR_UNAUTHORIZED");
    }

    return prisma.$transaction(async (tx) => {
      if (booking.slotId) {
        await tx.availabilitySlot.update({
          where: { id: booking.slotId },
          data: { status: SlotStatus.AVAILABLE },
        });
      }

      return tx.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.CANCELLED,
          cancellationReason: reason || "User requested cancellation",
          slotId: null, // Clear slotId so it doesn't block future bookings!
        },
      });
    });
  }
}

export const bookingService = new BookingService();
