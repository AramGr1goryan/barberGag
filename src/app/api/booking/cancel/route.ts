import { NextRequest, NextResponse } from "next/server";
import { bookingService } from "@/services/booking.service";
import { authService } from "@/services/auth.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, reason } = body;

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
    }

    const session = await authService.getSession();
    const sessionToken = req.cookies.get("barber_session_token")?.value;

    const authId = session?.userId || sessionToken;
    if (!authId) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    await bookingService.cancelBooking(bookingId, authId, reason);

    // Send Telegram cancellation notification
    const { telegramService } = await import("@/services/telegram.service");
    try {
      await telegramService.notifyBookingCancelled(bookingId, reason);
    } catch (err) {
      console.error("Failed to send telegram cancellation notification:", err);
    }

    // Fetch configured cooldown hours from settings (default 3 hours)
    const { getCancellationCooldownHours } = await import("@/lib/settings");
    const cooldownHours = await getCancellationCooldownHours();

    const response = NextResponse.json({
      success: true,
      message: "Appointment cancelled",
      cooldownHours,
      blockedUntil: new Date(Date.now() + cooldownHours * 3600 * 1000).toISOString(),
    });

    if (cooldownHours > 0) {
      response.cookies.set({
        name: "barber_cancelled_at",
        value: String(Date.now()),
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: Math.floor(cooldownHours * 3600),
        path: "/",
      });
    }

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to cancel booking";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
