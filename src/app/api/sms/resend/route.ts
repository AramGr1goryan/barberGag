import { NextRequest, NextResponse } from "next/server";
import { smsService } from "@/services/sms.service";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const locale = req.cookies.get("barber_locale")?.value || "hy";
    const result = await smsService.sendVerificationCode(booking.id, booking.guestPhone, locale);

    if (!result.success) {
      if (result.error === "RESEND_COOLDOWN") {
        return NextResponse.json(
          {
            error: "Please wait before requesting another code.",
            resendAvailableInSeconds: result.resendAvailableInSeconds,
          },
          { status: 429 }
        );
      }
      return NextResponse.json({ error: "Failed to send verification SMS." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      resendAvailableInSeconds: result.resendAvailableInSeconds || 60,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error resending SMS";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
