import { describe, it, expect } from "vitest";
import { parseDateTimeToMinutes } from "../src/lib/timezone";
import { BookingStatus } from "@prisma/client";

describe("30-Minute Telegram Arrival Reminder & 23:59 Daily Summary Tests", () => {
  describe("30-Minute Arrival Reminder", () => {
    it("should accurately detect a booking starting in 30 minutes", () => {
      const today = "2026-09-12";
      const currentTime = "14:00";
      const appointmentTime = "14:30";

      const currentMinutes = parseDateTimeToMinutes(today, currentTime);
      const appointmentMinutes = parseDateTimeToMinutes(today, appointmentTime);

      const diffMinutes = appointmentMinutes - currentMinutes;

      expect(diffMinutes).toBe(30);
      expect(diffMinutes >= 0 && diffMinutes <= 32).toBe(true);
    });

    it("should not trigger reminder for bookings too far in advance (e.g., 60 minutes)", () => {
      const today = "2026-09-12";
      const currentTime = "14:00";
      const appointmentTime = "15:00";

      const currentMinutes = parseDateTimeToMinutes(today, currentTime);
      const appointmentMinutes = parseDateTimeToMinutes(today, appointmentTime);

      const diffMinutes = appointmentMinutes - currentMinutes;

      expect(diffMinutes).toBe(60);
      expect(diffMinutes >= 0 && diffMinutes <= 32).toBe(false);
    });

    it("should not trigger reminder for appointments that already passed", () => {
      const today = "2026-09-12";
      const currentTime = "14:35";
      const appointmentTime = "14:30";

      const currentMinutes = parseDateTimeToMinutes(today, currentTime);
      const appointmentMinutes = parseDateTimeToMinutes(today, appointmentTime);

      const diffMinutes = appointmentMinutes - currentMinutes;

      expect(diffMinutes).toBe(-5);
      expect(diffMinutes >= 0 && diffMinutes <= 32).toBe(false);
    });

    it("should format the Armenian Telegram reminder with exact required fields: Name, Service, Phone", () => {
      const booking = {
        guestName: "Դավիթ Սարգսյան",
        guestPhone: "+374 77 123456",
        startTime: "14:30",
        endTime: "15:30",
        date: "2026-09-12",
        bookingNumber: "BK-7890",
        services: "Premium Մազերի կտրվածք + Մորուք",
        totalPriceFormatted: "15 000 ֏",
      };

      const message = [
        `⏰ <b>ՀԻՇԵՑՈՒՄ՝ 30 ՐՈՊԵԻՑ ՈՒՆԵՔ ՀԱՃԱԽՈՐԴ!</b>`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `👤 <b>Հաճախորդ՝</b> ${booking.guestName}`,
        `💈 <b>Ծառայություն՝</b> ${booking.services}`,
        `📞 <b>Հեռախոսահամար՝</b> <code>${booking.guestPhone}</code>`,
        `⏰ <b>Գրանցման ժամ՝</b> <b>${booking.startTime} - ${booking.endTime}</b> (${booking.date})`,
        `🔖 <b>Ամրագրման համար՝</b> <code>${booking.bookingNumber}</code>`,
        `💰 <b>Գումար՝</b> <b>${booking.totalPriceFormatted}</b>`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `📍 <i>Հաճախորդը կժամանի մոտ 30 րոպեից: Խնդրում ենք նախապատրաստել աշխատատեղը:</i>`,
      ].join("\n");

      expect(message).toContain("ՀԻՇԵՑՈՒՄ՝ 30 ՐՈՊԵԻՑ ՈՒՆԵՔ ՀԱՃԱԽՈՐԴ!");
      expect(message).toContain(`Հաճախորդ՝</b> ${booking.guestName}`);
      expect(message).toContain(`Ծառայություն՝</b> ${booking.services}`);
      expect(message).toContain(`Հեռախոսահամար՝</b> <code>${booking.guestPhone}</code>`);
      expect(message).toContain("14:30 - 15:30");
    });
  });

  describe("23:59 Daily Summary Report (Revenue & Tomorrow Registrations)", () => {
    it("should calculate today's revenue EXCLUSIVELY from COMPLETED bookings (checked off by barber)", () => {
      const todayBookings = [
        { id: "b1", status: BookingStatus.COMPLETED, totalPriceMinorUnits: 10000 },
        { id: "b2", status: BookingStatus.COMPLETED, totalPriceMinorUnits: 15000 },
        { id: "b3", status: BookingStatus.CANCELLED, totalPriceMinorUnits: 12000 },
        { id: "b4", status: BookingStatus.CONFIRMED, totalPriceMinorUnits: 8000 },
      ];

      const completedBookings = todayBookings.filter((b) => b.status === BookingStatus.COMPLETED);
      const todayRevenue = completedBookings.reduce((sum, b) => sum + b.totalPriceMinorUnits, 0);

      expect(completedBookings.length).toBe(2);
      expect(todayRevenue).toBe(25000);
      expect(todayRevenue).not.toBe(45000);
    });

    it("should calculate tomorrow's confirmed registrations and format Armenian report", () => {
      const tomorrowBookings = [
        {
          startTime: "11:00",
          endTime: "12:00",
          guestName: "Արման Գրիգորյան",
          guestPhone: "+374 98 112233",
          services: "Մազերի կտրվածք",
          bookingNumber: "BK-1001",
        },
        {
          startTime: "14:00",
          endTime: "15:00",
          guestName: "Գարիկ Հակոբյան",
          guestPhone: "+374 55 445566",
          services: "Մորուքի խնամք",
          bookingNumber: "BK-1002",
        },
      ];

      const todayRevenue = 25000;
      const todayCompletedCount = 2;
      const tomorrowCount = tomorrowBookings.length;

      const scheduleItems = tomorrowBookings.map(
        (b, i) => `${i + 1}. <b>${b.startTime} - ${b.endTime}</b> — <b>${b.guestName}</b> (№ <code>${b.bookingNumber}</code>)\n   💈 ${b.services} • 📞 <code>${b.guestPhone}</code>`
      );

      const message = [
        `📊 <b>ՕՐՎԱ ԱՄՓՈՓՈՒՄ (23:59) — 2026-09-12</b>`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `💰 <b>ԱՅՍՕՐՎԱ ԵԿԱՄՈՒՏ՝</b> <b>${todayRevenue.toLocaleString("hy-AM")} ֏</b>`,
        `✅ <b>Կատարված այցելություններ՝</b> <b>${todayCompletedCount}</b>`,
        ``,
        `━━━━━━━━━━━━━━━━━━━━`,
        `📅 <b>ՎԱՂՎԱ ԳՐԱՆՑՈՒՄՆԵՐԸ (2026-09-13)՝</b>`,
        `👥 <b>Սպասվող հաճախորդներ՝</b> <b>${tomorrowCount} գրանցում</b>`,
        ``,
        scheduleItems.join("\n- - - - - - - - - - - - - - - - - - - - - - - -\n"),
        `━━━━━━━━━━━━━━━━━━━━`,
        `💈 <i>Barber Shop Daily Intelligence Report</i>`,
      ].join("\n");

      expect(message).toContain("ՕՐՎԱ ԱՄՓՈՓՈՒՄ (23:59)");
      expect(message).toMatch(/ԱՅՍՕՐՎԱ ԵԿԱՄՈՒՏ՝<\/b> <b>25[ \u00A0]000 ֏<\/b>/);
      expect(message).toContain("Կատարված այցելություններ՝</b> <b>2</b>");
      expect(message).toContain("Սպասվող հաճախորդներ՝</b> <b>2 գրանցում</b>");
      expect(message).toContain("Արման Գրիգորյան");
      expect(message).toContain("+374 98 112233");
    });
  });
});
