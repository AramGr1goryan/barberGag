import { NextRequest, NextResponse } from "next/server";
import { reminderService } from "@/services/reminder.service";

export async function GET(req: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = req.headers.get("authorization");
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const result = await reminderService.checkAndSend30MinReminders();
    return NextResponse.json({ success: true, timestamp: new Date().toISOString(), ...result });
  } catch (err: unknown) {
    console.error("Cron reminders error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
