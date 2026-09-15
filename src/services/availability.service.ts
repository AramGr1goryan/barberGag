import { prisma } from "@/lib/prisma";
import { SlotStatus, BookingStatus } from "@prisma/client";

export interface PublicDayAvailability {
  date: string;
  isOpen: boolean;
  slots: {
    id: string;
    startTime: string;
    endTime: string;
    status: SlotStatus;
  }[];
}

function getYerevanCurrentDateAndTime() {
  const dateStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Yerevan",
  }).format(new Date());

  const timeStr = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Yerevan",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());

  return { dateStr, timeStr };
}

export class AvailabilityService {
  /**
   * Release slots that have been held for more than 10 minutes without completed verification
   */
  async cleanupExpiredHeldSlots() {
    try {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      
      // 1. Clean up abandoned PENDING_VERIFICATION bookings
      const expiredBookings = await prisma.booking.findMany({
        where: {
          status: BookingStatus.PENDING_VERIFICATION,
          updatedAt: { lt: tenMinutesAgo },
        },
        select: { id: true, slotId: true },
      });

      if (expiredBookings.length > 0) {
        const bookingIds = expiredBookings.map((b) => b.id);
        const slotIds = expiredBookings.map((b) => b.slotId).filter(Boolean) as string[];

        await prisma.booking.updateMany({
          where: { id: { in: bookingIds } },
          data: {
            slotId: null,
            status: BookingStatus.CANCELLED,
            cancellationReason: "EXPIRED_VERIFICATION",
          },
        });

        if (slotIds.length > 0) {
          await prisma.availabilitySlot.updateMany({
            where: { id: { in: slotIds } },
            data: { status: SlotStatus.AVAILABLE },
          });
        }
      }
      
      // 2. Also clean up any lingering HELD slots just in case
      const expiredSlots = await prisma.availabilitySlot.findMany({
        where: {
          status: SlotStatus.HELD,
          updatedAt: { lt: tenMinutesAgo },
        },
      });

      if (expiredSlots.length > 0) {
        const slotIds = expiredSlots.map((s) => s.id);
        await prisma.availabilitySlot.updateMany({
          where: { id: { in: slotIds } },
          data: { status: SlotStatus.AVAILABLE },
        });
      }
    } catch (e) {
      console.error("Error cleaning up expired held slots/bookings:", e);
    }
  }

  /**
   * Public customer query: Returns available slots for a given date.
   * STRICT RULE: Closed by default. If day not explicitly opened, returns empty slots.
   */
  async getPublicAvailabilityForDate(dateStr: string): Promise<PublicDayAvailability> {
    await this.cleanupExpiredHeldSlots();

    const day = await prisma.availabilityDay.findUnique({
      where: { date: dateStr },
      include: {
        slots: {
          where: { status: SlotStatus.AVAILABLE },
          include: {
            booking: {
              select: { id: true, status: true },
            },
          },
          orderBy: { startTime: "asc" },
        },
      },
    });

    if (!day || !day.isOpen) {
      return {
        date: dateStr,
        isOpen: false,
        slots: [],
      };
    }

    const { dateStr: todayYerevanStr, timeStr: currentHourMin } = getYerevanCurrentDateAndTime();

    const validSlots = day.slots.filter((s) => {
      // Must not have an active booking
      if (s.booking && s.booking.status !== "CANCELLED") {
        return false;
      }
      // If it's today, slot must be in the future
      if (dateStr === todayYerevanStr && s.startTime <= currentHourMin) {
        return false;
      }
      return true;
    });

    return {
      date: day.date,
      isOpen: true,
      slots: validSlots.map((s) => ({
        id: s.id,
        startTime: s.startTime,
        endTime: s.endTime,
        status: s.status,
      })),
    };
  }

  /**
   * Public query: Returns list of dates that are OPEN in the next N days.
   * Any date not returned is CLOSED by default.
   */
  async getOpenDates(startDate: string, endDate: string): Promise<string[]> {
    await this.cleanupExpiredHeldSlots();

    const days = await prisma.availabilityDay.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        isOpen: true,
        slots: {
          some: {
            status: SlotStatus.AVAILABLE,
          },
        },
      },
      include: {
        slots: {
          where: { status: SlotStatus.AVAILABLE },
          include: {
            booking: {
              select: { id: true, status: true },
            },
          },
        },
      },
      orderBy: { date: "asc" },
    });

    const { dateStr: todayYerevanStr, timeStr: currentHourMin } = getYerevanCurrentDateAndTime();

    return days
      .filter((d) => {
        return d.slots.some((s) => {
          if (s.booking && s.booking.status !== "CANCELLED") return false;
          if (d.date === todayYerevanStr && s.startTime <= currentHourMin) return false;
          return true;
        });
      })
      .map((d) => d.date);
  }

  /**
   * Admin: Get all days and slots for a given date, including BOOKED and BLOCKED slots.
   */
  async getAdminDayDetails(dateStr: string) {
    let day = await prisma.availabilityDay.findUnique({
      where: { date: dateStr },
      include: {
        slots: {
          include: {
            booking: {
              select: {
                id: true,
                bookingNumber: true,
                guestName: true,
                guestPhone: true,
                status: true,
              },
            },
          },
          orderBy: { startTime: "asc" },
        },
      },
    });

    if (!day) {
      return {
        date: dateStr,
        isOpen: false,
        slots: [],
      };
    }

    return day;
  }

  /**
   * Admin: Open or close a specific date.
   */
  async setDayOpenStatus(dateStr: string, isOpen: boolean, notes?: string) {
    return prisma.availabilityDay.upsert({
      where: { date: dateStr },
      update: { isOpen, notes },
      create: { date: dateStr, isOpen, notes },
    });
  }

  /**
   * Admin: Open a specific date, specific hour/time, with session duration.
   */
  async createSingleSlot(
    dateStr: string,
    startTime: string,
    durationMinutes: number = 60
  ) {
    // Ensure the day is registered and open
    const day = await prisma.availabilityDay.upsert({
      where: { date: dateStr },
      update: { isOpen: true },
      create: { date: dateStr, isOpen: true },
    });

    const [startH, startM] = startTime.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = startMinutes + durationMinutes;

    const endH = Math.floor(endMinutes / 60)
      .toString()
      .padStart(2, "0");
    const endM = (endMinutes % 60).toString().padStart(2, "0");
    const endTime = `${endH}:${endM}`;

    const slot = await prisma.availabilitySlot.upsert({
      where: {
        availabilityDayId_startTime: {
          availabilityDayId: day.id,
          startTime,
        },
      },
      update: {
        endTime,
        status: SlotStatus.AVAILABLE,
      },
      create: {
        availabilityDayId: day.id,
        startTime,
        endTime,
        status: SlotStatus.AVAILABLE,
      },
    });

    return { day, slot };
  }

  /**
   * Admin: Bulk generate time slots for a day.
   */
  async bulkGenerateSlots(
    dateStr: string,
    startTime: string,
    endTime: string,
    slotDurationMinutes: number = 60
  ) {
    // Ensure the day is registered and open
    const day = await prisma.availabilityDay.upsert({
      where: { date: dateStr },
      update: { isOpen: true },
      create: { date: dateStr, isOpen: true },
    });

    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);

    let currentMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    const createdSlots = [];

    while (currentMinutes + slotDurationMinutes <= endMinutes) {
      const slotStartH = Math.floor(currentMinutes / 60)
        .toString()
        .padStart(2, "0");
      const slotStartM = (currentMinutes % 60).toString().padStart(2, "0");
      const slotStart = `${slotStartH}:${slotStartM}`;

      const slotEndMinutes = currentMinutes + slotDurationMinutes;
      const slotEndH = Math.floor(slotEndMinutes / 60)
        .toString()
        .padStart(2, "0");
      const slotEndM = (slotEndMinutes % 60).toString().padStart(2, "0");
      const slotEnd = `${slotEndH}:${slotEndM}`;

      const slot = await prisma.availabilitySlot.upsert({
        where: {
          availabilityDayId_startTime: {
            availabilityDayId: day.id,
            startTime: slotStart,
          },
        },
        update: {
          endTime: slotEnd,
          status: SlotStatus.AVAILABLE,
        },
        create: {
          availabilityDayId: day.id,
          startTime: slotStart,
          endTime: slotEnd,
          status: SlotStatus.AVAILABLE,
        },
      });

      createdSlots.push(slot);
      currentMinutes += slotDurationMinutes;
    }

    return createdSlots;
  }

  /**
   * Admin: Update slot status (AVAILABLE, BLOCKED, CANCELLED).
   */
  async updateSlotStatus(slotId: string, status: SlotStatus) {
    return prisma.availabilitySlot.update({
      where: { id: slotId },
      data: { status },
    });
  }

  /**
   * Admin: Delete a slot if not booked.
   */
  async deleteSlot(slotId: string) {
    const slot = await prisma.availabilitySlot.findUnique({
      where: { id: slotId },
      include: { booking: true },
    });

    if (slot?.booking) {
      throw new Error("Cannot delete a slot with an active booking. Cancel the booking first.");
    }

    return prisma.availabilitySlot.delete({
      where: { id: slotId },
    });
  }
}

export const availabilityService = new AvailabilityService();
