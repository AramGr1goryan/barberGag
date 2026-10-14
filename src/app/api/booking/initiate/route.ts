import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bookingService } from "@/services/booking.service";
import { createBookingSchema } from "@/validators/booking.schema";
import { authService } from "@/services/auth.service";
import { checkRateLimit } from "@/lib/rate-limiter";
import { handleApiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const rateCheck = checkRateLimit(`booking:initiate:${ip}`, 10, 60 * 1000); // 10 per min
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const validated = createBookingSchema.parse(body);

    const session = await authService.getSession();
    const sessionToken = req.cookies.get("barber_session_token")?.value;
    const locale = req.cookies.get("barber_locale")?.value || "hy";

    // Enforce Cancellation Cooldown
    const { getCancellationCooldownHours } = await import("@/lib/settings");
    const cooldownHours = await getCancellationCooldownHours();

    if (cooldownHours > 0) {
      const cutoff = new Date(Date.now() - cooldownHours * 3600 * 1000);
      const { hashToken } = await import("@/lib/crypto");
      const hashedToken = sessionToken ? hashToken(sessionToken) : undefined;

      const recentCancelled = await prisma.booking.findFirst({
        where: {
          status: "CANCELLED",
          updatedAt: { gte: cutoff },
          OR: [
            { guestPhone: validated.guestPhone },
            ...(session?.userId ? [{ userId: session.userId }] : []),
            ...(hashedToken ? [{ sessionTokenHash: hashedToken }] : []),
          ],
        },
        orderBy: { updatedAt: "desc" },
      });

      if (recentCancelled) {
        const unlockTimeMs = new Date(recentCancelled.updatedAt).getTime() + cooldownHours * 3600 * 1000;
        const remainingMinutes = Math.ceil((unlockTimeMs - Date.now()) / (60 * 1000));
        return NextResponse.json(
          {
            error: "CANCELLATION_COOLDOWN_ACTIVE",
            message:
              locale === "ru"
                ? `После отмены записи новая регистрация заблокирована на ${cooldownHours} ч. (осталось ${remainingMinutes} мин.).`
                : locale === "en"
                ? `After cancellation, new bookings are blocked for ${cooldownHours}h (remaining: ${remainingMinutes}m).`
                : `Չեղարկումից հետո գրանցումը արգելափակված է ${cooldownHours} ժամով (մնացել է ${remainingMinutes} րոպե):`,
            blockedUntil: new Date(unlockTimeMs).toISOString(),
            remainingMinutes,
          },
          { status: 403 }
        );
      }
    }

    const result = await bookingService.createBooking({
      ...validated,
      userId: (session?.userId && session.userId !== "env-admin") ? session.userId : undefined,
      locale,
    });

    const response = NextResponse.json({
      success: true,
      bookingId: result.booking.id,
      bookingNumber: result.booking.bookingNumber,
      verificationRequired: result.verificationRequired,
    });

    // Set secure HTTP-only session cookie for returning guest detection
    response.cookies.set({
      name: "barber_session_token",
      value: result.sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    return handleApiError(error, "Failed to initiate booking", 400);
  }
}
