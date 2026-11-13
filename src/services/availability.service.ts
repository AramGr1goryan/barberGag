import { prisma } from "@/lib/prisma";
import { SlotStatus, BookingStatus } from "@prisma/client";
import {
  getBreakStartTime,
  setBreakStartTime,
  getBreakDayOverrides,
  saveBreakDayOverrides,
  getBreakStartTimeForDate,
} from "@/lib/settings";

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
      const { breakStartTime: breakStart } = await getBreakStartTimeForDate(day.date);
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

  private findBreakConflictsForDays(
    days: Array<{
      date: string;
      slots: Array<{
        startTime: string;
        endTime: string;
        status: SlotStatus;
        booking: { status: BookingStatus; guestName: string; startTime: string; endTime: string } | null;
      }>;
    }>,
    activeBookings: Array<{
      date: string;
      guestName: string;
      startTime: string;
      endTime: string;
    }>,
    breakStartMin: number,
    breakEndMin: number
  ) {
    const conflicts: {
      date: string;
      guestName: string;
      startTime: string;
      endTime: string;
    }[] = [];
    const conflictingDatesSet = new Set<string>();
    const allowedDates = new Set(days.map((d) => d.date));

    for (const b of activeBookings) {
      if (!allowedDates.has(b.date)) continue;
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

    return { conflicts, conflictingDatesSet };
  }

  private buildRestoreSlotsForDay(
    day: {
      id: string;
      date: string;
      isOpen: boolean;
      slots: Array<{
        startTime: string;
        endTime: string;
        status: SlotStatus;
        booking: { status: BookingStatus } | null;
      }>;
    },
    activeBookings: Array<{ date: string; startTime: string; endTime: string }>,
    prevStartMin: number,
    prevEndMin: number
  ) {
    if (!day.isOpen && day.slots.length === 0) return [];
    const slotsToRestore: {
      availabilityDayId: string;
      startTime: string;
      endTime: string;
      status: SlotStatus;
    }[] = [];

    for (let m = prevStartMin; m < prevEndMin; m += 15) {
      if (m + 15 > 24 * 60) continue;
      const chunkStart = m;
      const chunkEnd = m + 15;

      const hasBookingAtChunk = activeBookings.some(
        (b) =>
          b.date === day.date &&
          timeToMin(b.startTime) < chunkEnd &&
          timeToMin(b.endTime) > chunkStart
      );
      if (hasBookingAtChunk) continue;

      const hasOccupiedSlotAtChunk = day.slots.some((s) => {
        if (s.status !== SlotStatus.BOOKED && s.status !== SlotStatus.HELD) return false;
        if (s.booking && s.booking.status === BookingStatus.CANCELLED) return false;
        return timeToMin(s.startTime) < chunkEnd && timeToMin(s.endTime) > chunkStart;
      });
      if (hasOccupiedSlotAtChunk) continue;

      slotsToRestore.push({
        availabilityDayId: day.id,
        startTime: minToTime(chunkStart),
        endTime: minToTime(chunkEnd),
        status: SlotStatus.AVAILABLE,
      });
    }

    return slotsToRestore;
  }

  private collectAvailableSlotIdsInRange(
    day: {
      slots: Array<{
        id: string;
        startTime: string;
        endTime: string;
        status: SlotStatus;
      }>;
    },
    rangeStartMin: number,
    rangeEndMin: number
  ) {
    const ids: string[] = [];
    for (const s of day.slots) {
      if (s.status !== SlotStatus.AVAILABLE) continue;
      const sStart = timeToMin(s.startTime);
      const sEnd = timeToMin(s.endTime);
      if (sStart < rangeEndMin && sEnd > rangeStartMin) {
        ids.push(s.id);
      }
    }
    return ids;
  }

  /**
   * Apply a 30-minute break starting at `breakStartTime` (e.g. "12:00" -> closes "12:00" and "12:15", leaves "12:30" open)
   * across `fromDate` and all subsequent dates (`date >= fromDate`).
   * Preserves per-day overrides on subsequent dates (`date > fromDate`), while clearing any override on `fromDate` itself.
   */
  async applyBreakTime(fromDate: string, breakStartTime: string, force: boolean = false) {
    await this.ensureCurrentMonthInitialized();

    const breakStartMin = timeToMin(breakStartTime);
    const breakEndMin = breakStartMin + 30;
    const breakEndTime = minToTime(breakEndMin);

    const [days, activeBookings, overrides] = await Promise.all([
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
      getBreakDayOverrides(),
    ]);

    // Days strictly after `fromDate` with their own per-day override stay on their custom break.
    const daysToApply = days.filter(
      (d) => d.date === fromDate || !overrides[d.date]
    );

    const { conflicts, conflictingDatesSet } = this.findBreakConflictsForDays(
      daysToApply,
      activeBookings,
      breakStartMin,
      breakEndMin
    );

    if (conflictingDatesSet.size > 0 && !force) {
      return {
        applied: false,
        requiresConfirmation: true,
        scope: "fromDate" as const,
        breakStartTime,
        breakEndTime,
        conflicts,
        conflictingDates: Array.from(conflictingDatesSet),
      };
    }

    const previousGlobalBreak = await getBreakStartTime();
    await setBreakStartTime(breakStartTime);

    // If `fromDate` itself had a per-day override, clear it so `fromDate` follows the new global schedule
    const hadFromDateOverride = Boolean(overrides[fromDate]);
    if (hadFromDateOverride) {
      const updatedOverrides = { ...overrides };
      delete updatedOverrides[fromDate];
      await saveBreakDayOverrides(updatedOverrides);
    }

    // Reopen previous break slots on non-overridden days >= fromDate where there is no booking
    const slotsToRestore: {
      availabilityDayId: string;
      startTime: string;
      endTime: string;
      status: SlotStatus;
    }[] = [];

    for (const d of daysToApply) {
      const prevForDay =
        d.date === fromDate && hadFromDateOverride
          ? overrides[fromDate]
          : previousGlobalBreak;
      if (!prevForDay || prevForDay === breakStartTime) continue;

      const prevStartMin = timeToMin(prevForDay);
      const prevEndMin = prevStartMin + 30;
      slotsToRestore.push(
        ...this.buildRestoreSlotsForDay(d, activeBookings, prevStartMin, prevEndMin)
      );
    }

    if (slotsToRestore.length > 0) {
      await prisma.availabilitySlot.createMany({
        data: slotsToRestore,
        skipDuplicates: true,
      });
    }

    // Close unoccupied slots in [breakStartMin, breakEndMin) on all non-conflicting target days >= fromDate
    const nonConflictingDays = daysToApply.filter((d) => !conflictingDatesSet.has(d.date));
    const slotIdsToDelete = nonConflictingDays.flatMap((d) =>
      this.collectAvailableSlotIdsInRange(d, breakStartMin, breakEndMin)
    );

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
      scope: "fromDate" as const,
      breakStartTime,
      breakEndTime,
      closedDaysCount: nonConflictingDays.length,
      closedSlotsCount: slotIdsToDelete.length,
      skippedDates: Array.from(conflictingDatesSet),
    };
  }

  /**
   * Apply or reset a 30-minute break for a single specific date (`targetDate`) without modifying global or other days' schedules.
   */
  async applyBreakTimeForDay(
    targetDate: string,
    breakStartTime: string,
    force: boolean = false
  ) {
    await this.ensureCurrentMonthInitialized();

    const breakStartMin = timeToMin(breakStartTime);
    const breakEndMin = breakStartMin + 30;
    const breakEndTime = minToTime(breakEndMin);

    const [day, activeBookings, globalBreak, overrides] = await Promise.all([
      prisma.availabilityDay.findUnique({
        where: { date: targetDate },
        include: {
          slots: {
            include: {
              booking: {
                select: { id: true, guestName: true, startTime: true, endTime: true, status: true },
              },
            },
          },
        },
      }),
      prisma.booking.findMany({
        where: {
          date: targetDate,
          status: {
            in: [BookingStatus.CONFIRMED, BookingStatus.PENDING_VERIFICATION, BookingStatus.COMPLETED],
          },
        },
        orderBy: [{ startTime: "asc" }],
      }),
      getBreakStartTime(),
      getBreakDayOverrides(),
    ]);

    const { conflicts, conflictingDatesSet } = this.findBreakConflictsForDays(
      day ? [day] : [],
      activeBookings,
      breakStartMin,
      breakEndMin
    );

    if (conflictingDatesSet.size > 0 && !force) {
      return {
        applied: false,
        requiresConfirmation: true,
        scope: "single" as const,
        targetDate,
        breakStartTime,
        breakEndTime,
        conflicts,
        conflictingDates: Array.from(conflictingDatesSet),
      };
    }

    const previousDayBreak = overrides[targetDate] || globalBreak;
    const updatedOverrides = { ...overrides };
    if (breakStartTime === globalBreak) {
      delete updatedOverrides[targetDate];
    } else {
      updatedOverrides[targetDate] = breakStartTime;
    }
    await saveBreakDayOverrides(updatedOverrides);

    let closedSlotsCount = 0;

    if (day) {
      if (previousDayBreak && previousDayBreak !== breakStartTime) {
        const prevStartMin = timeToMin(previousDayBreak);
        const prevEndMin = prevStartMin + 30;
        const slotsToRestore = this.buildRestoreSlotsForDay(
          day,
          activeBookings,
          prevStartMin,
          prevEndMin
        );
        if (slotsToRestore.length > 0) {
          await prisma.availabilitySlot.createMany({
            data: slotsToRestore,
            skipDuplicates: true,
          });
        }
      }

      const slotIdsToDelete = this.collectAvailableSlotIdsInRange(
        day,
        breakStartMin,
        breakEndMin
      );
      if (slotIdsToDelete.length > 0) {
        await prisma.availabilitySlot.deleteMany({
          where: {
            id: { in: slotIdsToDelete },
            status: SlotStatus.AVAILABLE,
          },
        });
        closedSlotsCount = slotIdsToDelete.length;
      }
    }

    return {
      applied: true,
      requiresConfirmation: false,
      scope: "single" as const,
      targetDate,
      breakStartTime,
      breakEndTime,
      isDayBreakOverride: breakStartTime !== globalBreak,
      closedDaysCount: day ? 1 : 0,
      closedSlotsCount,
      skippedDates: [],
    };
  }

  /**
   * Reset a single date's custom break back to the global default break time.
   */
  async resetBreakTimeForDay(targetDate: string, force: boolean = false) {
    const globalBreak = await getBreakStartTime();
    return this.applyBreakTimeForDay(targetDate, globalBreak, force);
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
