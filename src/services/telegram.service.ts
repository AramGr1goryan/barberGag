import { prisma } from "@/lib/prisma";

export const DEFAULT_TELEGRAM_CHAT_IDS = ["901694987"];

function escapeHtml(text: string | null | undefined): string {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export class TelegramService {
  private botToken: string;

  constructor() {
    this.botToken =
      process.env.TELEGRAM_BOT_TOKEN || "8759445377:AAHlFEiEgsVsNNOv0DVbWtwCe1YV2x2KSB8";
  }

  /**
   * Retrieves all active Telegram Chat IDs (combining defaults, environment, database, and getUpdates).
   */
  async getAllChatIds(): Promise<string[]> {
    const ids = new Set<string>(DEFAULT_TELEGRAM_CHAT_IDS);

    // 1. Check environment variable (comma or space separated)
    if (process.env.TELEGRAM_CHAT_ID && process.env.TELEGRAM_CHAT_ID.trim()) {
      process.env.TELEGRAM_CHAT_ID.split(/[,;\s]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((id) => ids.add(id));
    }

    // 2. Check database SiteContent
    try {
      const record = await prisma.siteContent.findUnique({
        where: { key: "telegram_chat_id" },
      });
      if (record && record.valueEn && record.valueEn.trim()) {
        record.valueEn
          .split(/[,;\s]+/)
          .map((s) => s.trim())
          .filter(Boolean)
          .forEach((id) => ids.add(id));
      }
    } catch {
      // ignore
    }

    // 3. Auto-detect from getUpdates
    try {
      const res = await fetch(`https://api.telegram.org/bot${this.botToken}/getUpdates`);
      const data = await res.json();
      if (data.ok && Array.isArray(data.result) && data.result.length > 0) {
        for (const item of data.result) {
          const chat = item?.message?.chat;
          if (chat?.id) {
            ids.add(String(chat.id));
          }
        }
      }
    } catch {
      // ignore
    }

    return Array.from(ids);
  }

  /**
   * Retrieves single or primary active Telegram Chat ID.
   */
  async getChatId(): Promise<string | null> {
    const all = await this.getAllChatIds();
    return all.length > 0 ? all.join(", ") : null;
  }

  /**
   * Saves or appends Telegram Chat ID to database settings.
   */
  async saveChatId(chatId: string): Promise<void> {
    const existing = await this.getAllChatIds();
    const set = new Set<string>(existing);
    chatId
      .split(/[,;\s]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((id) => set.add(id));

    const combined = Array.from(set).join(", ");

    await prisma.siteContent.upsert({
      where: { key: "telegram_chat_id" },
      update: {
        valueHy: combined,
        valueRu: combined,
        valueEn: combined,
        section: "notifications",
      },
      create: {
        key: "telegram_chat_id",
        valueHy: combined,
        valueRu: combined,
        valueEn: combined,
        section: "notifications",
      },
    });
  }

  /**
   * Sends message via Telegram Bot API to a specific chat ID or to ALL configured recipient chats.
   */
  async sendMessage(
    text: string,
    targetChatId?: string
  ): Promise<{ success: boolean; error?: string; sentCount?: number }> {
    const chatIds = targetChatId ? [targetChatId] : await this.getAllChatIds();

    if (chatIds.length === 0) {
      return {
        success: false,
        error: "NO_CHAT_ID: Нажмите /start в боте @barberGag_bot для привязки чата",
      };
    }

    let sentCount = 0;
    const errors: string[] = [];

    await Promise.allSettled(
      chatIds.map(async (cid) => {
        try {
          const res = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: cid,
              text,
              parse_mode: "HTML",
            }),
          });

          const data = await res.json();
          if (data.ok) {
            sentCount++;
          } else {
            errors.push(`Chat ${cid}: ${data.description || "error"}`);
          }
        } catch (err: unknown) {
          errors.push(`Chat ${cid}: ${err instanceof Error ? err.message : "network error"}`);
        }
      })
    );

    if (sentCount > 0) {
      return { success: true, sentCount };
    }

    return {
      success: false,
      error: errors.join(" | ") || "Failed to send message to Telegram recipients",
    };
  }

  /**
   * Formats the day's schedule concisely and informatively for Telegram alerts:
   * Shows: time, guest name, booking number, service, and phone for all bookings of that day.
   */
  async formatDaySchedule(
    dateStr: string,
    currentBookingId?: string,
    highlightLabel: string = "ՆՈՐ"
  ): Promise<string> {
    try {
      const bookings = await prisma.booking.findMany({
        where: {
          date: dateStr,
          status: { in: ["CONFIRMED", "COMPLETED"] },
        },
        include: {
          items: true,
        },
        orderBy: {
          startTime: "asc",
        },
      });

      // If current booking is not in the query result (e.g. status was PENDING_VERIFICATION) and not cancelled, include it
      if (currentBookingId && !bookings.some((b) => b.id === currentBookingId)) {
        const extra = await prisma.booking.findUnique({
          where: { id: currentBookingId },
          include: { items: true },
        });
        if (extra && extra.date === dateStr && extra.status !== "CANCELLED") {
          bookings.push(extra);
          bookings.sort((a, b) => a.startTime.localeCompare(b.startTime));
        }
      }

      if (!bookings || bookings.length === 0) {
        return [
          `━━━━━━━━━━━━━━━━━━━━`,
          `📋 <b>ՕՐՎԱ ԳՐԱՖԻԿԸ (${dateStr})՝</b>`,
          `<i>Այս օրվա համար գրանցումներ չկան:</i>`,
          `━━━━━━━━━━━━━━━━━━━━`,
        ].join("\n");
      }

      const totalCount = bookings.length;
      const countLabel = `${totalCount} ${totalCount === 1 ? "գրանցում" : "գրանցում"}`;

      const scheduleItems = bookings.map((b) => {
        const services =
          b.items.length > 0
            ? b.items.map((it) => escapeHtml(it.nameSnapshot)).join(", ")
            : "Հիմնական ծառայություն";

        const isCurrent = currentBookingId && b.id === currentBookingId;
        const marker = isCurrent ? "👉" : "•";
        const tag = isCurrent && highlightLabel ? ` <i>[${highlightLabel}]</i>` : "";

        return [
          `${marker} <b>${b.startTime} - ${b.endTime}</b> — <b>${escapeHtml(b.guestName)}</b> (№ <code>${escapeHtml(b.bookingNumber)}</code>)${tag}`,
          `  💈 ${services} • 📞 <code>${escapeHtml(b.guestPhone)}</code>`,
        ].join("\n");
      });

      const formattedSchedule = scheduleItems.join("\n- - - - - - - - - - - - - - - - - - - - - - - - - - - -\n");

      return [
        `━━━━━━━━━━━━━━━━━━━━`,
        `📋 <b>ՕՐՎԱ ԳՐԱՖԻԿԸ (${dateStr})՝</b> (${countLabel})`,
        `━━━━━━━━━━━━━━━━━━━━`,
        formattedSchedule,
        `━━━━━━━━━━━━━━━━━━━━`,
      ].join("\n");
    } catch (err) {
      console.error("Failed to build day schedule for telegram:", err);
      return "";
    }
  }

  /**
   * Formats and sends complete booking details to all Telegram recipient chats.
   */
  async notifyNewBooking(bookingId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          items: true,
          slot: true,
        },
      });

      if (!booking) {
        return { success: false, error: "Booking not found" };
      }

      const totalAmount = (booking.totalPriceMinorUnits / 100).toLocaleString("hy-AM");

      const itemsList =
        booking.items.length > 0
          ? booking.items
            .map(
              (item, i) =>
                `  ${i + 1}. <b>${escapeHtml(item.nameSnapshot)}</b> — ${(item.priceSnapshotMinor / 100).toLocaleString("hy-AM")} ֏ (${item.durationSnapshotMin} րոպե)`
            )
            .join("\n")
          : "  • Հիմնական ծառայություն";

      const statusBadge =
        booking.status === "CONFIRMED"
          ? "✅ ՀԱՍՏԱՏՎԱԾ Է"
          : booking.status === "PENDING_VERIFICATION"
            ? "⏳ ՍՊԱՍՈՒՄ Է ՀԱՍՏԱՏՄԱՆ"
            : booking.status;

      const daySchedule = await this.formatDaySchedule(booking.date, booking.id, "ՆՈՐ");

      const message = [
        `✂️ <b>ՆՈՐ ԱՄՐԱԳՐՈՒՄ!</b>`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `👤 <b>Հաճախորդ՝</b> ${escapeHtml(booking.guestName)}`,
        `📞 <b>Հեռախոսահամար՝</b> <code>${escapeHtml(booking.guestPhone)}</code>`,
        `📅 <b>Ամսաթիվ՝</b> ${booking.date}`,
        `⏰ <b>Ժամ՝</b> ${booking.startTime} - ${booking.endTime}`,
        `🔖 <b>Ամրագրման համար՝</b> <code>${escapeHtml(booking.bookingNumber)}</code>`,
        `📌 <b>Կարգավիճակ՝</b> ${statusBadge}`,
        ``,
        `💈 <b>Ընտրված ծառայություններ՝</b>`,
        itemsList,
        ``,
        `⏱ <b>Ընդհանուր տևողություն՝</b> ${booking.totalDurationMinutes} րոպե`,
        `💰 <b>Ընդհանուր գումար՝</b> <b>${totalAmount} ֏</b>`,
        ...(daySchedule ? [``, daySchedule] : [`━━━━━━━━━━━━━━━━━━━━`]),
        `📍 <i>Հասցե՝ Հյուսիսային պողոտա 10, Երևան</i>`,
      ].join("\n");

      return await this.sendMessage(message);
    } catch (err: unknown) {
      console.error("Failed to send booking notification to Telegram:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Error sending telegram notification",
      };
    }
  }

  /**
   * Formats and sends cancellation notification to Telegram in Armenian.
   */
  async notifyBookingCancelled(
    bookingId: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { items: true },
      });

      if (!booking) {
        return { success: false, error: "Booking not found" };
      }

      const totalAmount = (booking.totalPriceMinorUnits / 100).toLocaleString("hy-AM");

      const daySchedule = await this.formatDaySchedule(booking.date);

      const message = [
        `❌ <b>ԱՄՐԱԳՐՈՒՄԸ ՉԵՂԱՐԿՎԵԼ Է!</b>`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `👤 <b>Հաճախորդ՝</b> ${escapeHtml(booking.guestName)}`,
        `📞 <b>Հեռախոսահամար՝</b> <code>${escapeHtml(booking.guestPhone)}</code>`,
        `📅 <b>Չեղարկված ամսաթիվ՝</b> ${booking.date}`,
        `⏰ <b>Ժամ՝</b> ${booking.startTime} - ${booking.endTime}`,
        `🔖 <b>Ամրագրման համար՝</b> <code>${escapeHtml(booking.bookingNumber)}</code>`,
        `📝 <b>Պատճառ՝</b> ${escapeHtml(reason || "Նշված չէ")}`,
        `💰 <b>Գումար՝</b> ${totalAmount} ֏`,
        ...(daySchedule ? [``, daySchedule] : [`━━━━━━━━━━━━━━━━━━━━`]),
        `📍 <i>Ժամը ազատվել է և կրկին հասանելի է գրանցման համար</i>`,
      ].join("\n");

      return await this.sendMessage(message);
    } catch (err: unknown) {
      console.error("Failed to send cancellation notification to Telegram:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Error sending cancellation notification",
      };
    }
  }

  /**
   * Formats and sends rescheduled booking notification to Telegram in Armenian.
   */
  async notifyBookingRescheduled(
    bookingId: string,
    oldDate?: string,
    oldTime?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { items: true },
      });

      if (!booking) {
        return { success: false, error: "Booking not found" };
      }

      const totalAmount = (booking.totalPriceMinorUnits / 100).toLocaleString("hy-AM");

      const itemsList =
        booking.items.length > 0
          ? booking.items
            .map((item, i) => `  ${i + 1}. <b>${escapeHtml(item.nameSnapshot)}</b>`)
            .join("\n")
          : "  • Հիմնական ծառայություն";

      const newDaySchedule = await this.formatDaySchedule(
        booking.date,
        booking.id,
        "ՏԵՂԱՓՈԽՎԱԾ"
      );

      let scheduleSection = newDaySchedule;
      if (oldDate && oldDate !== booking.date) {
        const oldDaySchedule = await this.formatDaySchedule(oldDate);
        scheduleSection = [
          `📅 <b>ՆԱԽԿԻՆ ՕՐՎԱ ԹԱՐՄԱՑՎԱԾ ԳՐԱՖԻԿԸ (${oldDate})՝</b>`,
          oldDaySchedule,
          ``,
          `📅 <b>ՆՈՐ ՕՐՎԱ ԳՐԱՖԻԿԸ (${booking.date})՝</b>`,
          newDaySchedule,
        ].join("\n");
      }

      const message = [
        `🔄 <b>ԱՄՐԱԳՐՄԱՆ ԺԱՄԻ ՓՈՓՈԽՈՒԹՅՈՒՆ!</b>`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `👤 <b>Հաճախորդ՝</b> ${escapeHtml(booking.guestName)}`,
        `📞 <b>Հեռախոսահամար՝</b> <code>${escapeHtml(booking.guestPhone)}</code>`,
        `🔖 <b>Ամրագրման համար՝</b> <code>${escapeHtml(booking.bookingNumber)}</code>`,
        oldDate ? `⏳ <b>Նախկին ժամ՝</b> ${oldDate} (${oldTime || ""})` : "",
        `✨ <b>ՆՈՐ ԺԱՄ՝</b> <b>${booking.date} | ${booking.startTime} - ${booking.endTime}</b>`,
        ``,
        `💈 <b>Ծառայություններ՝</b>`,
        itemsList,
        `💰 <b>Ընդհանուր գումար՝</b> ${totalAmount} ֏`,
        ...(scheduleSection ? [``, scheduleSection] : [`━━━━━━━━━━━━━━━━━━━━`]),
        `📍 <i>Վարպետի գրաֆիկը ավտոմատ թարմացվել է</i>`,
      ]
        .filter(Boolean)
        .join("\n");

      return await this.sendMessage(message);
    } catch (err: unknown) {
      console.error("Failed to send reschedule notification to Telegram:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Error sending reschedule notification",
      };
    }
  }

  /**
   * Formats and sends new callback request notification to Telegram in Armenian.
   */
  async notifyCallbackRequest(
    callbackId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const req = await prisma.callbackRequest.findUnique({
        where: { id: callbackId },
      });

      if (!req) {
        return { success: false, error: "Callback request not found" };
      }

      const message = [
        `📞 <b>ՀԵՏԱԴԱՐՁ ԿԱՊԻ / ԶԱՆԳԻ ՀԱՐՑՈՒՄ!</b>`,
        `━━━━━━━━━━━━━━━━━━━━━━`,
        `👤 <b>Հաճախորդ՝</b> ${escapeHtml(req.name)}`,
        `📞 <b>Հեռախոսահամար՝</b> <code>${escapeHtml(req.phone)}</code>`,
        `⏰ <b>Հարմար ժամ՝</b> ${escapeHtml(req.preferredTime || "Հնարավորինս շուտ")}`,
        `💬 <b>Հաղորդագրություն՝</b> ${escapeHtml(req.message || "Առանց մեկնաբանության")}`,
        `━━━━━━━━━━━━━━━━━━━━━━`,
        `⚡ <i>Խնդրում ենք կապ հաստատել հաճախորդի հետ</i>`,
      ].join("\n");

      return await this.sendMessage(message);
    } catch (err: unknown) {
      console.error("Failed to send callback notification to Telegram:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Error sending callback notification",
      };
    }
  }

  /**
   * Formats and sends 30-minute client arrival reminder to Telegram in Armenian.
   */
  async notifyClient30MinReminder(
    bookingId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { items: true },
      });

      if (!booking) {
        return { success: false, error: "Booking not found" };
      }

      const services =
        booking.items.length > 0
          ? booking.items.map((it) => escapeHtml(it.nameSnapshot)).join(", ")
          : "Հիմնական ծառայություն";

      const totalAmount = Math.round(booking.totalPriceMinorUnits).toLocaleString("hy-AM");

      const message = [
        `⏰ <b>ՀԻՇԵՑՈՒՄ՝ 30 ՐՈՊԵԻՑ ՈՒՆԵՔ ՀԱՃԱԽՈՐԴ!</b>`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `👤 <b>Հաճախորդ՝</b> ${escapeHtml(booking.guestName)}`,
        `💈 <b>Ծառայություն՝</b> ${services}`,
        `📞 <b>Հեռախոսահամար՝</b> <code>${escapeHtml(booking.guestPhone)}</code>`,
        `⏰ <b>Գրանցման ժամ՝</b> <b>${booking.startTime} - ${booking.endTime}</b> (${booking.date})`,
        `🔖 <b>Ամրագրման համար՝</b> <code>${escapeHtml(booking.bookingNumber)}</code>`,
        `💰 <b>Գումար՝</b> <b>${totalAmount} ֏</b>`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `📍 <i>Հաճախորդը կժամանի մոտ 30 րոպեից: Խնդրում ենք նախապատրաստել աշխատատեղը:</i>`,
      ].join("\n");

      return await this.sendMessage(message);
    } catch (err: unknown) {
      console.error("Failed to send 30-minute reminder to Telegram:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Error sending 30-minute reminder",
      };
    }
  }

  /**
   * Formats and sends 23:59 daily financial summary & tomorrow's registrations report in Armenian.
   */
  async notifyDailySummaryReport(data: {
    todayDate: string;
    todayRevenue: number;
    todayCompletedCount: number;
    tomorrowDate: string;
    tomorrowCount: number;
    tomorrowBookings: Array<{
      startTime: string;
      endTime: string;
      guestName: string;
      guestPhone: string;
      services: string;
      bookingNumber: string;
    }>;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const revenueFormatted = Math.round(data.todayRevenue).toLocaleString("hy-AM");

      let tomorrowScheduleText = `<i>Վաղվա համար դեռևս գրանցումներ չկան:</i>`;
      if (data.tomorrowBookings.length > 0) {
        tomorrowScheduleText = data.tomorrowBookings
          .map(
            (b, idx) =>
              `${idx + 1}. <b>${b.startTime} - ${b.endTime}</b> — <b>${escapeHtml(b.guestName)}</b> (№ <code>${escapeHtml(b.bookingNumber)}</code>)\n` +
              `   💈 ${escapeHtml(b.services)} • 📞 <code>${escapeHtml(b.guestPhone)}</code>`
          )
          .join("\n- - - - - - - - - - - - - - - - - - - - - - - -\n");
      }

      const message = [
        `📊 <b>ՕՐՎԱ ԱՄՓՈՓՈՒՄ (23:59) — ${data.todayDate}</b>`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `💰 <b>ԱՅՍՕՐՎԱ ԵԿԱՄՈՒՏ՝</b> <b>${revenueFormatted} ֏</b>`,
        `✅ <b>Կատարված այցելություններ՝</b> <b>${data.todayCompletedCount}</b>`,
        ``,
        `━━━━━━━━━━━━━━━━━━━━`,
        `📅 <b>ՎԱՂՎԱ ԳՐԱՆՑՈՒՄՆԵՐԸ (${data.tomorrowDate})՝</b>`,
        `👥 <b>Սպասվող հաճախորդներ՝</b> <b>${data.tomorrowCount} գրանցում</b>`,
        ``,
        tomorrowScheduleText,
        `━━━━━━━━━━━━━━━━━━━━`,
        `💈 <i>Barber Shop Daily Intelligence Report</i>`,
      ].join("\n");

      return await this.sendMessage(message);
    } catch (err: unknown) {
      console.error("Failed to send daily summary report to Telegram:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Error sending daily summary report",
      };
    }
  }
}

export const telegramService = new TelegramService();

