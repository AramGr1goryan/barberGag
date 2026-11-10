import { prisma } from "@/lib/prisma";
import { SlotStatus, BookingStatus } from "@prisma/client";
import { getBreakStartTime, setBreakStartTime } from "@/lib/settings";

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


function timeToMin(timeStr: string) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function minToTime(totalMin: number) {
  const h = Math.floor(totalMin / 60).toString().padStart(2, "0");
  const m = (totalMin % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function getAvailableStartSlots(daySlots: any[], durationMinutes: number, todayYerevanStr: string, currentHourMin: string, dateStr: string) {
  const availableCandidates = daySlots.filter(s => {
    if (s.status !== "AVAILABLE") return false;
    if (s.booking && s.booking.status !== "CANCELLED") return false;
    if (dateStr === todayYerevanStr && s.startTime <= currentHourMin) return false;
    return true;
  });

  const slotsNeeded = Math.ceil(durationMinutes / 15);
  const result = [];

  for (const candidate of availableCandidates) {
    const candidateStartMin = timeToMin(candidate.startTime);
    const candidateEndMin = candidateStartMin + durationMinutes;
    
    // 1. Check if all consecutive AVAILABLE slots exist
    let hasAllConsecutive = true;
    for (let i = 0; i < slotsNeeded; i++) {
      const neededStartMin = candidateStartMin + i * 15;
      const found = availableCandidates.find(s => timeToMin(s.startTime) === neededStartMin);
      if (!found) {
        hasAllConsecutive = false;
        break;
      }
    }
    if (!hasAllConsecutive) continue;

    // 2. Check for overlaps with ANY non-available or booked slot
    let hasOverlap = false;
    for (const slot of daySlots) {
      const isAvailablePool = availableCandidates.some(s => s.id === slot.id);
      if (!isAvailablePool) {
        const slotStart = timeToMin(slot.startTime);
        const slotEnd = timeToMin(slot.endTime);
        if (slotStart < candidateEndMin && slotEnd > candidateStartMin) {
          hasOverlap = true;
          break;
        }
      }
    }

    if (!hasOverlap) {
      result.push(candidate);
    }
  }

  return result;
}

export class AvailabilityService {
  private currentMonthInitialized: string | null = null;

  public async ensureCurrentMonthInitialized() {
    const { dateStr: todayYerevanStr } = getYerevanCurrentDateAndTime();
    const [yearStr, monthStr] = todayYerevanStr.split("-");
    const monthPrefix = `${yearStr}-${monthStr}`;
    
    if (this.currentMonthInitialized === monthPrefix) {
      return;
    }
    
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    
    const daysInMonth = new Date(year, month, 0).getDate();
    
    const existingDaysCount = await prisma.availabilityDay.count({
      where: { date: { startsWith: monthPrefix } }
    });
    
    if (existingDaysCount < daysInMonth) {
      const existingDays = await prisma.availabilityDay.findMany({
        where: { date: { startsWith: monthPrefix } },
        select: { date: true, id: true }
      });
      const existingDates = new Set(existingDays.map(d => d.date));
      
      const missingDaysToCreate = [];
      for (let d = 1; d <= daysInMonth; d++) {
        const dStr = `${monthPrefix}-${d.toString().padStart(2, '0')}`;
        if (!existingDates.has(dStr)) {
          missingDaysToCreate.push({ date: dStr, isOpen: true });
        }
      }

      if (missingDaysToCreate.length > 0) {
        await prisma.availabilityDay.createMany({ data: missingDaysToCreate, skipDuplicates: true });
      }

      // Now fetch all days again to get their IDs
      const allDays = await prisma.availabilityDay.findMany({
        where: { date: { startsWith: monthPrefix } }
      });

      // Find which days need slots generated
      for (let d = 1; d <= daysInMonth; d++) {
        const dStr = `${monthPrefix}-${d.toString().padStart(2, '0')}`;
        if (!existingDates.has(dStr)) {
          const day = allDays.find(day => day.date === dStr);
          if (day) {
            await this.bulkGenerateSlotsInternal(day, "10:00", "24:00", 15);
          }
        }
      }
    }
    
    this.currentMonthInitialized = monthPrefix;

    const existingBreakSetting = await prisma.siteContent.findUnique({
      where: { key: "barber_break_start_time" },
    });
    if (!existingBreakSetting) {
      await this.applyBreakTime(todayYerevanStr, "12:00", true);
    }
  }

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
        select: { id: true, slots: { select: { id: true } } },
      });

      if (expiredBookings.length > 0) {
        const bookingIds = expiredBookings.map((b) => b.id);
        const slotIds = expiredBookings.flatMap((b) => b.slots.map(s => s.id));

        await prisma.booking.updateMany({
          where: { id: { in: bookingIds } },
          data: {
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
  async getPublicAvailabilityForDate(dateStr: string, durationMinutes: number = 15): Promise<PublicDayAvailability> {
    await this.ensureCurrentMonthInitialized();
    await this.cleanupExpiredHeldSlots();

    const day = await prisma.availabilityDay.findUnique({
      where: { date: dateStr },
      include: {
        slots: {
          include: {
            booking: { select: { id: true, status: true } },
          },
          orderBy: { startTime: "asc" },
        },
      },
    });

    if (!day || !day.isOpen) {
      return { date: dateStr, isOpen: false, slots: [] };
    }

    const { dateStr: todayYerevanStr, timeStr: currentHourMin } = getYerevanCurrentDateAndTime();
    const availableStartSlots = getAvailableStartSlots(day.slots, durationMinutes, todayYerevanStr, currentHourMin, dateStr);

    return {
      date: day.date,
      isOpen: true,
      slots: availableStartSlots.map((s) => ({
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
  async getOpenDates(startDate: string, endDate: string, durationMinutes: number = 15): Promise<string[]> {
    await this.ensureCurrentMonthInitialized();
    await this.cleanupExpiredHeldSlots();

    const days = await prisma.availabilityDay.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        isOpen: true,
      },
      include: {
        slots: {
          include: {
            booking: { select: { id: true, status: true } },
          },
          orderBy: { startTime: "asc" }
        },
      },
      orderBy: { date: "asc" },
    });

    const { dateStr: todayYerevanStr, timeStr: currentHourMin } = getYerevanCurrentDateAndTime();

    return days
      .filter((d) => {
        const availableStartSlots = getAvailableStartSlots(d.slots, durationMinutes, todayYerevanStr, currentHourMin, d.date);
        return availableStartSlots.length > 0;
      })
      .map((d) => d.date);
  }

  /**
   * Admin: Get all days and slots for a given date, including BOOKED and BLOCKED slots.
   */
  async getAdminDayDetails(dateStr: string) {
    await this.ensureCurrentMonthInitialized();

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
                guestRealPhone: true,
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
    durationMinutes: number = 15
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

    const endH = Math.floor(endMinutes / 60).toString().padStart(2, "0");
    const endM = (endMinutes % 60).toString().padStart(2, "0");
    const endTime = `${endH}:${endM}`;

    // Generate 15-min chunks instead of 1 large slot to prevent overlap bugs
    await this.bulkGenerateSlotsInternal(day, startTime, endTime, 15, false);

    // Fetch the first slot to return (for backward compatibility if anyone uses the return value)
    const slot = await prisma.availabilitySlot.findUnique({
      where: {
        availabilityDayId_startTime: {
          availabilityDayId: day.id,
          startTime,
        },
      },
    });

    return { day, slot };
  }

  async bulkGenerateSlots(
    dateStr: string,
    startTime: string,
    endTime: string,
    slotDurationMinutes: number = 15
  ) {
    const day = await prisma.availabilityDay.upsert({
      where: { date: dateStr },
      update: { isOpen: true },
      create: { date: dateStr, isOpen: true },
    });

    return this.bulkGenerateSlotsInternal(day, startTime, endTime, slotDurationMinutes, true);
  }

  /**
   * Internal optimized slot generator avoiding O(N) DB calls.
   */
  private async bulkGenerateSlotsInternal(
    day: any,
    startTime: string,
    endTime: string,
    slotDurationMinutes: number = 15,
    respectBreak: boolean = true
  ) {
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);

    let currentMinutes = startH * 60 + startM;
    // 00:00 as end time means midnight (end of the day)
    const endMinutes = endH * 60 + endM || 24 * 60;

    let breakStartMin = -1;
    let breakEndMin = -1;
    if (respectBreak) {
      const breakStart = await getBreakStartTime();
      if (breakStart && /^([01]\d|2[0-3]):[0-5]\d$/.test(breakStart)) {
        breakStartMin = timeToMin(breakStart);
        breakEndMin = breakStartMin + 30;
      }
    }

    const existingSlots = await prisma.availabilitySlot.findMany({
      where: { availabilityDayId: day.id }
    });
    const existingMap = new Map(existingSlots.map(s => [s.startTime, s]));

    const newSlotsData = [];
    const slotsToUpdate = [];
    const slotIdsToDelete: string[] = [];

    while (currentMinutes + slotDurationMinutes <= endMinutes) {
      const slotStart = `${Math.floor(currentMinutes / 60).toString().padStart(2, "0")}:${(currentMinutes % 60).toString().padStart(2, "0")}`;
      const slotEndMinutes = currentMinutes + slotDurationMinutes;
      const slotEnd = `${Math.floor(slotEndMinutes / 60).toString().padStart(2, "0")}:${(slotEndMinutes % 60).toString().padStart(2, "0")}`;

      const isBreakSlot =
        respectBreak &&
        breakStartMin >= 0 &&
        currentMinutes < breakEndMin &&
        slotEndMinutes > breakStartMin;

      const existingSlot = existingMap.get(slotStart);

      if (isBreakSlot) {
        if (existingSlot && existingSlot.status === SlotStatus.AVAILABLE) {
          slotIdsToDelete.push(existingSlot.id);
        }
      } else if (existingSlot) {
        if (existingSlot.status === SlotStatus.AVAILABLE && existingSlot.endTime !== slotEnd) {
          slotsToUpdate.push({ id: existingSlot.id, endTime: slotEnd });
        }
      } else {
        newSlotsData.push({
          availabilityDayId: day.id,
          startTime: slotStart,
          endTime: slotEnd,
          status: SlotStatus.AVAILABLE,
        });
      }

      currentMinutes += slotDurationMinutes;
    }

    if (slotIdsToDelete.length > 0) {
      await prisma.availabilitySlot.deleteMany({
        where: { id: { in: slotIdsToDelete }, status: SlotStatus.AVAILABLE },
      });
    }

    if (newSlotsData.length > 0) {
      await prisma.availabilitySlot.createMany({ data: newSlotsData, skipDuplicates: true });
    }

    for (const update of slotsToUpdate) {
      await prisma.availabilitySlot.update({
        where: { id: update.id },
        data: { endTime: update.endTime }
      });
    }

    return prisma.availabilitySlot.findMany({
      where: { availabilityDayId: day.id },
      orderBy: { startTime: 'asc' }
    });
  }

  /**
   * Apply a 30-minute break starting at `breakStartTime` (e.g. "12:00" -> closes "12:00" and "12:15", leaves "12:30" open)
   * across `fromDate` and all subsequent dates (`date >= fromDate`).
   * If any date `>= fromDate` has an active booking overlapping `[breakStartTime, breakEndTime)`:
   * - when `force` is false, returns `{ applied: false, requiresConfirmation: true, conflicts, ... }` without modifying slots.
   * - when `force` is true, closes the break slots on all days `>= fromDate` that do NOT have a conflicting booking.
   */
  async applyBreakTime(fromDate: string, breakStartTime: string, force: boolean = false) {
    await this.ensureCurrentMonthInitialized();

    const breakStartMin = timeToMin(breakStartTime);
    const breakEndMin = breakStartMin + 30;
    const breakEndTime = minToTime(breakEndMin);

    const [days, activeBookings] = await Promise.all([
      prisma.availabilityDay.findMany({
        where: { date: { gte: fromDate } },
        include: {
          slots: {
            include: {
              booking: {
                select: { id: true, guestName: true, startTime: true, endTime: true, status: true },
              },
            },
          },
        },
        orderBy: { date: "asc" },
      }),
      prisma.booking.findMany({
        where: {
          date: { gte: fromDate },
          status: {
            in: [BookingStatus.CONFIRMED, BookingStatus.PENDING_VERIFICATION, BookingStatus.COMPLETED],
          },
        },
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
      }),
    ]);

    const conflicts: {
      date: string;
      guestName: string;
      startTime: string;
      endTime: string;
    }[] = [];
    const conflictingDatesSet = new Set<string>();

    for (const b of activeBookings) {
      const bStart = timeToMin(b.startTime);
      const bEnd = timeToMin(b.endTime);
      if (bStart < breakEndMin && bEnd > breakStartMin) {
        conflictingDatesSet.add(b.date);
        conflicts.push({
          date: b.date,
          guestName: b.guestName,
          startTime: b.startTime,
          endTime: b.endTime,
        });
      }
    }

    for (const d of days) {
      if (conflictingDatesSet.has(d.date)) continue;
      for (const s of d.slots) {
        if (s.status === SlotStatus.BOOKED || s.status === SlotStatus.HELD) {
          if (s.booking && s.booking.status === BookingStatus.CANCELLED) continue;
          const sStart = timeToMin(s.startTime);
          const sEnd = timeToMin(s.endTime);
          if (sStart < breakEndMin && sEnd > breakStartMin) {
            conflictingDatesSet.add(d.date);
            conflicts.push({
              date: d.date,
              guestName: s.booking?.guestName || "Занято",
              startTime: s.booking?.startTime || s.startTime,
              endTime: s.booking?.endTime || s.endTime,
            });
            break;
          }
        }
      }
    }

    if (conflictingDatesSet.size > 0 && !force) {
      return {
        applied: false,
        requiresConfirmation: true,
        breakStartTime,
        breakEndTime,
        conflicts,
        conflictingDates: Array.from(conflictingDatesSet),
      };
    }

    const previousBreakStartTime = await getBreakStartTime();
    await setBreakStartTime(breakStartTime);

    // If break time changed, reopen previous break slots on open days >= fromDate where there is no booking
    if (previousBreakStartTime && previousBreakStartTime !== breakStartTime) {
      const prevStartMin = timeToMin(previousBreakStartTime);
      const prevEndMin = prevStartMin + 30;
      const slotsToRestore: {
        availabilityDayId: string;
        startTime: string;
        endTime: string;
        status: SlotStatus;
      }[] = [];

      for (const d of days) {
        if (!d.isOpen && d.slots.length === 0) continue;
        const hasBookingAtPrev = activeBookings.some(
          (b) =>
            b.date === d.date &&
            timeToMin(b.startTime) < prevEndMin &&
            timeToMin(b.endTime) > prevStartMin
        );
        if (hasBookingAtPrev) continue;

        for (let m = prevStartMin; m < prevEndMin; m += 15) {
          if (m + 15 <= 24 * 60) {
            slotsToRestore.push({
              availabilityDayId: d.id,
              startTime: minToTime(m),
              endTime: minToTime(m + 15),
              status: SlotStatus.AVAILABLE,
            });
          }
        }
      }

      if (slotsToRestore.length > 0) {
        await prisma.availabilitySlot.createMany({
          data: slotsToRestore,
          skipDuplicates: true,
        });
      }
    }

    // Close unoccupied slots in [breakStartMin, breakEndMin) on all non-conflicting days >= fromDate
    const nonConflictingDays = days.filter((d) => !conflictingDatesSet.has(d.date));
    const slotIdsToDelete: string[] = [];

    for (const d of nonConflictingDays) {
      for (const s of d.slots) {
        if (s.status !== SlotStatus.AVAILABLE) continue;
        const sStart = timeToMin(s.startTime);
        const sEnd = timeToMin(s.endTime);
        if (sStart < breakEndMin && sEnd > breakStartMin) {
          slotIdsToDelete.push(s.id);
        }
      }
    }

    if (slotIdsToDelete.length > 0) {
      await prisma.availabilitySlot.deleteMany({
        where: {
          id: { in: slotIdsToDelete },
          status: SlotStatus.AVAILABLE,
        },
      });
    }

    return {
      applied: true,
      requiresConfirmation: false,
      breakStartTime,
      breakEndTime,
      closedDaysCount: nonConflictingDays.length,
      closedSlotsCount: slotIdsToDelete.length,
      skippedDates: Array.from(conflictingDatesSet),
    };
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

    if (
      slot?.booking &&
      !["CANCELLED", "COMPLETED", "NO_SHOW"].includes(slot.booking.status)
    ) {
      throw new Error("Cannot delete a slot with an active booking. Cancel the booking first.");
    }

    return prisma.availabilitySlot.delete({
      where: { id: slotId },
    });
  }
}

export const availabilityService = new AvailabilityService();
