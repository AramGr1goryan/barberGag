import { prisma } from "@/lib/prisma";
import { telegramService } from "@/services/telegram.service";
import { BUSINESS_TIMEZONE, parseDateTimeToMinutes } from "@/lib/timezone";
import { BookingStatus } from "@prisma/client";

function shiftDate(dateStr: string, daysDelta: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dateObj = new Date(Date.UTC(y, m - 1, d + daysDelta, 12, 0, 0));
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(dateObj);
}

export class ReminderService {
  /**
   * Retrieves current time components in business timezone (Asia/Yerevan).
   */
  getCurrentYerevanTime(): { dateStr: string; timeStr: string; totalMinutes: number; hour: number; minute: number } {
    const now = new Date();
    const dateStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: BUSINESS_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);

    const timeFormatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: BUSINESS_TIMEZONE,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const timeStr = timeFormatter.format(now);
    const [hour, minute] = timeStr.split(":").map(Number);
    const totalMinutes = parseDateTimeToMinutes(dateStr, timeStr);

    return { dateStr, timeStr, totalMinutes, hour, minute };
  }

  /**
   * Checks upcoming bookings and sends a Telegram notification 30 minutes before arrival in Armenian.
   * Idempotent: checks AuditLog to prevent duplicate messages for the same booking.
   */
  async checkAndSend30MinReminders(): Promise<{
    checkedCount: number;
    sentCount: number;
    remindedBookings: string[];
    errors: string[];
  }> {
    const { dateStr: todayStr, totalMinutes: nowMinutes } = this.getCurrentYerevanTime();

    // Query active confirmed bookings for today
    const candidateBookings = await prisma.booking.findMany({
      where: {
        date: todayStr,
        status: BookingStatus.CONFIRMED,
      },
      include: {
        items: true,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    let sentCount = 0;
    const remindedBookings: string[] = [];
    const errors: string[] = [];

    for (const booking of candidateBookings) {
      try {
        const appointmentMin = parseDateTimeToMinutes(booking.date, booking.startTime);
        const diffMinutes = appointmentMin - nowMinutes;

        // Trigger reminder if arrival is between 0 and 32 minutes away
        // (Allows a 2-minute margin so cron or interval polling never skips a slot)
        if (diffMinutes >= 0 && diffMinutes <= 32) {
          // Check if reminder was already sent for this booking
          const existingLog = await prisma.auditLog.findFirst({
            where: {
              entity: "Booking",
              entityId: booking.id,
              action: "TELEGRAM_30MIN_REMINDER",
            },
          });

          if (!existingLog) {
            const sendRes = await telegramService.notifyClient30MinReminder(booking.id);
            if (sendRes.success) {
              sentCount++;
              remindedBookings.push(`${booking.bookingNumber} (${booking.guestName}, ${booking.startTime})`);

              // Mark as sent in AuditLog
              await prisma.auditLog.create({
                data: {
                  action: "TELEGRAM_30MIN_REMINDER",
                  entity: "Booking",
                  entityId: booking.id,
                  metadata: {
                    diffMinutes,
                    guestName: booking.guestName,
                    guestPhone: booking.guestPhone,
                    startTime: booking.startTime,
                    sentAt: new Date().toISOString(),
                  },
                },
              });
            } else if (sendRes.error) {
              errors.push(`Booking ${booking.bookingNumber}: ${sendRes.error}`);
            }
          }
        }
      } catch (err: unknown) {
        errors.push(
          `Booking ${booking.bookingNumber}: ${err instanceof Error ? err.message : "unknown error"}`
        );
      }
    }

    return {
      checkedCount: candidateBookings.length,
      sentCount,
      remindedBookings,
      errors,
    };
  }

  /**
   * Checks if current time is 23:59 (or 23:58-23:59) in Asia/Yerevan and sends daily financial & booking summary.
   * Calculates today's revenue strictly from COMPLETED bookings (checkmark in barber calendar).
   */
  async checkAndSendDailySummaryReport(options?: {
    force?: boolean;
    date?: string;
  }): Promise<{
    sent: boolean;
    reason?: string;
    todayRevenue?: number;
    todayCompletedCount?: number;
    tomorrowCount?: number;
  }> {
    const { dateStr: actualToday, hour, minute } = this.getCurrentYerevanTime();
    const todayStr = options?.date || actualToday;

    // Only send at 23:58 or 23:59, unless forced
    const isScheduledTime = hour === 23 && minute >= 58;
    if (!options?.force && !isScheduledTime) {
      return { sent: false, reason: `Not scheduled time (current time: ${hour}:${minute})` };
    }

    // Check if report was already sent for today
    if (!options?.force) {
      const alreadySent = await prisma.auditLog.findFirst({
        where: {
          entity: "DailyReport",
          entityId: todayStr,
          action: "TELEGRAM_DAILY_REPORT",
        },
      });

      if (alreadySent) {
        return { sent: false, reason: `Daily report already sent for ${todayStr}` };
      }
    }

    // 1. Calculate today's realized revenue strictly from COMPLETED appointments (checked off by barber)
    const todayCompletedBookings = await prisma.booking.findMany({
      where: {
        date: todayStr,
        status: BookingStatus.COMPLETED,
      },
      include: {
        items: true,
      },
    });

    const todayRevenue = todayCompletedBookings.reduce(
      (sum, b) => sum + (b.totalPriceMinorUnits || 0),
      0
    );
    const todayCompletedCount = todayCompletedBookings.length;

    // 2. Calculate tomorrow's registrations
    const tomorrowStr = shiftDate(todayStr, 1);
    const tomorrowBookings = await prisma.booking.findMany({
      where: {
        date: tomorrowStr,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
      },
      include: {
        items: true,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    const tomorrowList = tomorrowBookings.map((b) => {
      const services =
        b.items.length > 0
          ? b.items.map((it) => it.nameSnapshot).join(", ")
          : "Հիմնական ծառայություն";
      return {
        startTime: b.startTime,
        endTime: b.endTime,
        guestName: b.guestName,
        guestPhone: b.guestPhone,
        services,
        bookingNumber: b.bookingNumber,
      };
    });

    // 3. Send report via Telegram
    const sendResult = await telegramService.notifyDailySummaryReport({
      todayDate: todayStr,
      todayRevenue,
      todayCompletedCount,
      tomorrowDate: tomorrowStr,
      tomorrowCount: tomorrowBookings.length,
      tomorrowBookings: tomorrowList,
    });

    if (sendResult.success) {
      await prisma.auditLog.create({
        data: {
          action: "TELEGRAM_DAILY_REPORT",
          entity: "DailyReport",
          entityId: todayStr,
          metadata: {
            todayRevenue,
            todayCompletedCount,
            tomorrowCount: tomorrowBookings.length,
            sentAt: new Date().toISOString(),
          },
        },
      });

      return {
        sent: true,
        todayRevenue,
        todayCompletedCount,
        tomorrowCount: tomorrowBookings.length,
      };
    }

    return {
      sent: false,
      reason: sendResult.error || "Failed to deliver Telegram message",
    };
  }

  /**
   * Sends an immediate test 30-minute reminder to Telegram in Armenian.
   */
  async sendTestReminder(customPhone?: string): Promise<{ success: boolean; error?: string; sentCount?: number }> {
    const sampleMessage = [
      `⏰ <b>ՀԻՇԵՑՈՒՄ՝ 30 ՐՈՊԵԻՑ ՈՒՆԵՔ ՀԱՃԱԽՈՐԴ!</b> (ԹԵՍՏ)`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `👤 <b>Հաճախորդ՝</b> Դավիթ Սարգսյան (Թեստ)`,
      `💈 <b>Ծառայություն՝</b> Premium Մազերի կտրվածք + Մորուքի ձևավորում`,
      `📞 <b>Հեռախոսահամար՝</b> <code>${customPhone || "+374 77 123456"}</code>`,
      `⏰ <b>Գրանցման ժամ՝</b> <b>14:30 - 15:30</b> (Այսօր)`,
      `🔖 <b>Ամրագրման համար՝</b> <code>TEST-30MIN</code>`,
      `💰 <b>Գումար՝</b> <b>15 000 ֏</b>`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `📍 <i>Հաճախորդը կժամանի մոտ 30 րոպեից: Խնդրում ենք նախապատրաստել աշխատատեղը:</i>`,
      `⚡ <i>Հիշեցման համակարգի թեստային հաղորդագրություն</i>`,
    ].join("\n");

    return await telegramService.sendMessage(sampleMessage);
  }
}

export const reminderService = new ReminderService();
