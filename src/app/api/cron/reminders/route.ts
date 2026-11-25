import { NextRequest, NextResponse } from "next/server";
import { reminderService } from "@/services/reminder.service";
import { bookingService } from "@/services/booking.service";

export async function GET(req: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = req.headers.get("authorization");
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const autoCompletedCount = await bookingService.autoCompletePastBookings();
    const result = await reminderService.checkAndSend30MinReminders();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      autoCompletedCount,
      ...result,
    });
  } catch (err: unknown) {
    console.error("Cron reminders error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
