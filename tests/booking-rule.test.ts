import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  isWithinThreeHours,
  parseDateTimeToMinutes,
  isBookingStillActive,
} from "../src/lib/timezone";

describe("Three-Hour Booking Business Rule", () => {
  it("should calculate correct minutes since epoch for dates and times", () => {
    const min1 = parseDateTimeToMinutes("2026-09-20", "10:00");
    const min2 = parseDateTimeToMinutes("2026-09-20", "11:00");
    expect(min2 - min1).toBe(60);
  });

  it("should reject an appointment 60 minutes after existing appointment", () => {
    // 10:00 vs 11:00 (difference 60 min < 180 min)
    const conflict = isWithinThreeHours("2026-09-20", "11:00", "2026-09-20", "10:00");
    expect(conflict).toBe(true);
  });

  it("should reject an appointment 2 hours (120 minutes) before existing appointment", () => {
    // 13:00 vs 15:00 (difference 120 min < 180 min)
    const conflict = isWithinThreeHours("2026-09-20", "13:00", "2026-09-20", "15:00");
    expect(conflict).toBe(true);
  });

  it("should reject an appointment 179 minutes apart", () => {
    // 10:00 vs 12:59 (difference 179 min < 180 min)
    const conflict = isWithinThreeHours("2026-09-20", "12:59", "2026-09-20", "10:00");
    expect(conflict).toBe(true);
  });

  it("should permit an appointment exactly 180 minutes or more apart", () => {
    // 10:00 vs 13:00 (difference 180 min -> allowed)
    const conflict = isWithinThreeHours("2026-09-20", "13:00", "2026-09-20", "10:00");
    expect(conflict).toBe(false);
  });

  it("should permit an appointment 4 hours later on the same day", () => {
    // 10:00 vs 14:00 (difference 240 min)
    const conflict = isWithinThreeHours("2026-09-20", "14:00", "2026-09-20", "10:00");
    expect(conflict).toBe(false);
  });

  it("should correctly calculate intervals across consecutive calendar days", () => {
    // 2026-09-20 23:00 vs 2026-09-21 01:00 (difference 120 min)
    const conflict = isWithinThreeHours("2026-09-21", "01:00", "2026-09-20", "23:00");
    expect(conflict).toBe(true);
  });

  it("should permit appointments on different days beyond 3 hours", () => {
    // 2026-09-20 15:00 vs 2026-09-21 15:00
    const conflict = isWithinThreeHours("2026-09-21", "15:00", "2026-09-20", "15:00");
    expect(conflict).toBe(false);
  });
});

describe("Active Booking Date/Time & Auto-Complete Lifecycle", () => {
  it("should treat bookings on past dates as inactive", () => {
    expect(isBookingStillActive("2026-11-24", "22:00", "2026-11-25", "10:00")).toBe(false);
  });

  it("should treat bookings on future dates as active", () => {
    expect(isBookingStillActive("2026-11-26", "10:00", "2026-11-25", "20:00")).toBe(true);
  });

  it("should treat today's booking as active before endTime and inactive at/after endTime", () => {
    expect(isBookingStillActive("2026-11-25", "21:00", "2026-11-25", "20:00")).toBe(true);
    expect(isBookingStillActive("2026-11-25", "20:00", "2026-11-25", "20:00")).toBe(false);
    expect(isBookingStillActive("2026-11-25", "19:30", "2026-11-25", "20:00")).toBe(false);
  });

  it("should handle 24:00 endTime on today's booking", () => {
    expect(isBookingStillActive("2026-11-25", "24:00", "2026-11-25", "23:30")).toBe(true);
  });
});

describe("BookingService.autoCompletePastBookings & canUserBook", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should auto-complete all CONFIRMED bookings strictly before today", async () => {
    const { prisma } = await import("../src/lib/prisma");
    const { BookingService } = await import("../src/services/booking.service");
    const { getCurrentYerevanDateString } = await import("../src/lib/timezone");

    const updateManySpy = vi
      .spyOn(prisma.booking, "updateMany")
      .mockResolvedValue({ count: 3 } as never);

    const service = new BookingService();
    const count = await service.autoCompletePastBookings();

    expect(count).toBe(3);
    expect(updateManySpy).toHaveBeenCalledTimes(1);
    expect(updateManySpy).toHaveBeenCalledWith({
      where: {
        date: { lt: getCurrentYerevanDateString() },
        status: "CONFIRMED",
      },
      data: {
        status: "COMPLETED",
      },
    });

    // Second call on the same day should be throttled (no extra DB call)
    const secondCount = await service.autoCompletePastBookings();
    expect(secondCount).toBe(0);
    expect(updateManySpy).toHaveBeenCalledTimes(1);
  });

  it("should allow booking when only an already-ended booking from today exists", async () => {
    const { prisma } = await import("../src/lib/prisma");
    const { BookingService } = await import("../src/services/booking.service");

    vi.spyOn(prisma.booking, "updateMany").mockResolvedValue({ count: 0 } as never);
    vi.spyOn(prisma.booking, "findMany").mockResolvedValue([
      {
        id: "old-today",
        date: "2020-01-01",
        startTime: "10:00",
        endTime: "11:00",
        bookingNumber: "BK-0001",
      },
    ] as never);

    const service = new BookingService();
    const result = await service.canUserBook({
      phone: "test@mail.ru",
      requestedDate: "2099-01-02",
      requestedStartTime: "12:00",
    });

    expect(result.allowed).toBe(true);
  });

  it("should block booking when an upcoming CONFIRMED booking exists", async () => {
    const { prisma } = await import("../src/lib/prisma");
    const { BookingService } = await import("../src/services/booking.service");

    vi.spyOn(prisma.booking, "updateMany").mockResolvedValue({ count: 0 } as never);
    vi.spyOn(prisma.booking, "findMany").mockResolvedValue([
      {
        id: "future-1",
        date: "2099-12-31",
        startTime: "14:00",
        endTime: "15:00",
        bookingNumber: "BK-9999",
      },
    ] as never);

    const service = new BookingService();
    const result = await service.canUserBook({
      phone: "test@mail.ru",
      requestedDate: "2099-12-31",
      requestedStartTime: "18:00",
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("ACTIVE_BOOKING_EXISTS");
    expect(result.conflictingBooking?.bookingNumber).toBe("BK-9999");
  });
});
