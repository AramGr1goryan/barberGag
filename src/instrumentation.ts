export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { reminderService } = await import("@/services/reminder.service");

    // Background interval: checks every 60 seconds
    const CHECK_INTERVAL_MS = 60 * 1000;

    setInterval(async () => {
      try {
        // 1. Check 30-minute client arrival reminders
        await reminderService.checkAndSend30MinReminders();

        // 2. Check 23:59 daily financial & tomorrow registration report
        await reminderService.checkAndSendDailySummaryReport();
      } catch (err) {
        console.error("Background scheduled reminder/report error:", err);
      }
    }, CHECK_INTERVAL_MS);
  }
}
