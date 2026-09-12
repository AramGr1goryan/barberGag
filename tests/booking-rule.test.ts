import { describe, it, expect } from "vitest";
import { isWithinThreeHours, parseDateTimeToMinutes } from "../src/lib/timezone";

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
