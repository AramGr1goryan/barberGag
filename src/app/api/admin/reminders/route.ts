import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/services/auth.service";
import { reminderService } from "@/services/reminder.service";

export async function GET(req: NextRequest) {
  try {
    await authService.requireAdmin();
    const reminderResult = await reminderService.checkAndSend30MinReminders();
    const reportResult = await reminderService.checkAndSendDailySummaryReport();
    return NextResponse.json({
      success: true,
      reminders: reminderResult,
      dailyReport: reportResult,
    });
  } catch (err: unknown) {
    console.error("Admin reminders check error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await authService.requireAdmin();
    const body = await req.json().catch(() => ({}));
    const action = body.action || "check";

    if (action === "test") {
      const res = await reminderService.sendTestReminder(body.phone);
      return NextResponse.json(res);
    }

    if (action === "test_daily_report" || action === "daily_report") {
      const res = await reminderService.checkAndSendDailySummaryReport({ force: true, date: body.date });
      return NextResponse.json({ success: res.sent, ...res });
    }

    const reminderResult = await reminderService.checkAndSend30MinReminders();
    return NextResponse.json({ success: true, reminders: reminderResult });
  } catch (err: unknown) {
    console.error("Admin reminders action error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
