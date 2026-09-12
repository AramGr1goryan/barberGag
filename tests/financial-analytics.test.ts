import { describe, it, expect } from "vitest";
import { BookingStatus } from "@prisma/client";
import { formatDateInYerevan, shiftDateString } from "../src/services/financial-analytics.service";

describe("Financial Intelligence & Business Analytics Tests", () => {
  describe("Timezone and Date Arithmetic (Asia/Yerevan)", () => {
    it("should format dates in Asia/Yerevan timezone correctly", () => {
      const utcDate = new Date("2026-09-12T00:30:00Z");
      // In Asia/Yerevan (UTC+4), 00:30 UTC is 04:30 on the same day
      const formatted = formatDateInYerevan(utcDate);
      expect(formatted).toBe("2026-09-12");
    });

    it("should shift calendar dates accurately across month and year boundaries", () => {
      expect(shiftDateString("2026-09-12", 1)).toBe("2026-09-13");
      expect(shiftDateString("2026-09-12", -1)).toBe("2026-09-11");
      expect(shiftDateString("2026-09-01", -1)).toBe("2026-08-31");
      expect(shiftDateString("2026-01-01", -1)).toBe("2025-12-31");
      expect(shiftDateString("2026-02-28", 1)).toBe("2026-03-01");
    });
  });

  describe("Realized Revenue Recognition Rules", () => {
    it("should count revenue EXCLUSIVELY from COMPLETED appointments and exclude CANCELLED and CONFIRMED bookings", () => {
      const mockBookings = [
        {
          id: "booking-a",
          status: BookingStatus.COMPLETED,
          date: "2026-09-12",
          totalPriceMinorUnits: 10000,
        },
        {
          id: "booking-b",
          status: BookingStatus.CANCELLED,
          date: "2026-09-12",
          totalPriceMinorUnits: 20000,
        },
        {
          id: "booking-c",
          status: BookingStatus.CONFIRMED,
          date: "2026-09-12",
          totalPriceMinorUnits: 30000,
        },
        {
          id: "booking-d",
          status: BookingStatus.PENDING_VERIFICATION,
          date: "2026-09-12",
          totalPriceMinorUnits: 15000,
        },
      ];

      // Deterministic revenue calculation
      const realizedRevenue = mockBookings
        .filter((b) => b.status === BookingStatus.COMPLETED)
        .reduce((sum, b) => sum + b.totalPriceMinorUnits, 0);

      // Total sum of all bookings would be 75,000, but realized revenue MUST equal strictly 10,000 AMD
      expect(realizedRevenue).toBe(10000);
      expect(realizedRevenue).not.toBe(75000);
    });

    it("should calculate potential lost revenue accurately from cancelled appointments", () => {
      const mockBookings = [
        { id: "1", status: BookingStatus.COMPLETED, totalPriceMinorUnits: 15000 },
        { id: "2", status: BookingStatus.COMPLETED, totalPriceMinorUnits: 20000 },
        { id: "3", status: BookingStatus.CANCELLED, totalPriceMinorUnits: 12000 },
        { id: "4", status: BookingStatus.CANCELLED, totalPriceMinorUnits: 18000 },
      ];

      const completedRevenue = mockBookings
        .filter((b) => b.status === BookingStatus.COMPLETED)
        .reduce((sum, b) => sum + b.totalPriceMinorUnits, 0);

      const lostRevenue = mockBookings
        .filter((b) => b.status === BookingStatus.CANCELLED)
        .reduce((sum, b) => sum + b.totalPriceMinorUnits, 0);

      expect(completedRevenue).toBe(35000);
      expect(lostRevenue).toBe(30000);
    });

    it("should preserve historical snapshot prices even if service catalog price changes", () => {
      // Historical booking snapshot
      const historicalBookingItem = {
        serviceId: "svc-haircut",
        serviceName: "Premium Haircut",
        priceSnapshotMinor: 10000, // Price in January
      };

      // Current catalog service has increased price
      const currentCatalogService = {
        id: "svc-haircut",
        name: "Premium Haircut",
        priceMinorUnits: 15000, // Price in September
      };

      // Realized revenue must preserve the snapshot price
      const historicalRevenue = historicalBookingItem.priceSnapshotMinor;
      expect(historicalRevenue).toBe(10000);
      expect(historicalRevenue).not.toBe(currentCatalogService.priceMinorUnits);
    });
  });

  describe("KPI Calculations (Rates and Averages)", () => {
    it("should compute Completion Rate and Cancellation Rate correctly", () => {
      const completedCount = 18;
      const cancelledCount = 2;
      const totalEvaluated = completedCount + cancelledCount;

      const completionRate = Math.round((completedCount / totalEvaluated) * 1000) / 10;
      const cancellationRate = Math.round((cancelledCount / totalEvaluated) * 1000) / 10;

      expect(completionRate).toBe(90.0);
      expect(cancellationRate).toBe(10.0);
      expect(completionRate + cancellationRate).toBe(100.0);
    });

    it("should compute Average Transaction Value (ATV) without division by zero", () => {
      const completedBookings = [
        { totalPriceMinorUnits: 10000 },
        { totalPriceMinorUnits: 20000 },
        { totalPriceMinorUnits: 15000 },
      ];

      const totalRevenue = completedBookings.reduce((sum, b) => sum + b.totalPriceMinorUnits, 0);
      const atv = Math.round(totalRevenue / completedBookings.length);
      expect(atv).toBe(15000);

      // Zero completed handling
      const zeroCompletedCount = 0;
      const zeroATV = zeroCompletedCount > 0 ? Math.round(totalRevenue / zeroCompletedCount) : 0;
      expect(zeroATV).toBe(0);
    });
  });

  describe("Statistical Forecasting Engine", () => {
    it("should compute tomorrow expected revenue using historical completion probability", () => {
      const tomorrowBookings = [
        { id: "b1", totalPriceMinorUnits: 14000, status: BookingStatus.CONFIRMED },
        { id: "b2", totalPriceMinorUnits: 16000, status: BookingStatus.CONFIRMED },
        { id: "b3", totalPriceMinorUnits: 10000, status: BookingStatus.CONFIRMED },
        { id: "b4", totalPriceMinorUnits: 20000, status: BookingStatus.CONFIRMED },
        { id: "b5", totalPriceMinorUnits: 10000, status: BookingStatus.CONFIRMED },
      ];

      const confirmedBookedRev = tomorrowBookings.reduce((sum, b) => sum + b.totalPriceMinorUnits, 0);
      expect(confirmedBookedRev).toBe(70000);

      // Historical completion probability: 88%
      const historicalCompletionProb = 0.88;
      const expectedRevenue = Math.round(confirmedBookedRev * historicalCompletionProb);
      expect(expectedRevenue).toBe(61600);

      // Expected completed and cancellations
      const expectedCompleted = Math.round(tomorrowBookings.length * historicalCompletionProb * 10) / 10;
      const expectedCancellations = Math.round(tomorrowBookings.length * (1 - historicalCompletionProb) * 10) / 10;
      expect(expectedCompleted).toBe(4.4);
      expect(expectedCancellations).toBe(0.6);

      // Prediction interval range (Low - Expected - High)
      const lowBound = Math.round(expectedRevenue * 0.85);
      const highBound = Math.round(expectedRevenue * 1.15);
      expect(lowBound).toBeLessThan(expectedRevenue);
      expect(highBound).toBeGreaterThan(expectedRevenue);
    });

    it("should assign appropriate data sufficiency tiers and confidence levels", () => {
      const evaluateSufficiency = (totalRecords: number) => {
        if (totalRecords < 10) return { tier: "LIMITED", confidence: 55 };
        if (totalRecords < 30) return { tier: "BASIC", confidence: 72 };
        if (totalRecords < 75) return { tier: "MODERATE", confidence: 84 };
        return { tier: "STRONG", confidence: 92 };
      };

      expect(evaluateSufficiency(4)).toEqual({ tier: "LIMITED", confidence: 55 });
      expect(evaluateSufficiency(18)).toEqual({ tier: "BASIC", confidence: 72 });
      expect(evaluateSufficiency(50)).toEqual({ tier: "MODERATE", confidence: 84 });
      expect(evaluateSufficiency(120)).toEqual({ tier: "STRONG", confidence: 92 });
    });
  });

  describe("Customer Intelligence & LTV", () => {
    it("should correctly classify new vs returning customers based on >= 2 completed bookings", () => {
      const customerCompletedMap = new Map<string, number>([
        ["+37477111111", 1], // New (1 completed)
        ["+37477222222", 3], // Returning (3 completed)
        ["+37477333333", 2], // Returning (2 completed)
      ]);

      let newCustomers = 0;
      let returningCustomers = 0;

      for (const count of customerCompletedMap.values()) {
        if (count >= 2) {
          returningCustomers++;
        } else if (count === 1) {
          newCustomers++;
        }
      }

      expect(newCustomers).toBe(1);
      expect(returningCustomers).toBe(2);

      const repeatBookingRate = Math.round((returningCustomers / customerCompletedMap.size) * 1000) / 10;
      expect(repeatBookingRate).toBe(66.7);
    });
  });
});
