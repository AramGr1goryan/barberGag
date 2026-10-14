import { NextRequest, NextResponse } from "next/server";
import { bookingService } from "@/services/booking.service";
import { authService } from "@/services/auth.service";
import { rescheduleBookingSchema } from "@/validators/booking.schema";
import { handleApiError, apiSuccess } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = rescheduleBookingSchema.parse(body);

    const session = await authService.getSession();
    const sessionToken = req.cookies.get("barber_session_token")?.value;

    const authId = session?.userId || sessionToken;
    if (!authId) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { prisma } = await import("@/lib/prisma");
    const current = await prisma.booking.findUnique({
      where: { id: validated.bookingId },
      select: { date: true, startTime: true },
    });

    const updated = await bookingService.rescheduleBooking(
      validated.bookingId,
      validated.newSlotId,
      validated.newDate,
      {
        userId: session?.userId || undefined,
        sessionToken: sessionToken || undefined
      }
    );

    // Send Telegram reschedule notification
    const { telegramService } = await import("@/services/telegram.service");
    try {
      await telegramService.notifyBookingRescheduled(validated.bookingId, current?.date, current?.startTime);
    } catch (err) {
      console.error("Failed to send telegram reschedule notification:", err);
    }

    return apiSuccess({ booking: updated });
  } catch (error: unknown) {
    return handleApiError(error, "Failed to reschedule booking", 400);
  }
}
