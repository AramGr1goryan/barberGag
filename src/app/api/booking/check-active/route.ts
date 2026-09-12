import { NextRequest, NextResponse } from "next/server";
import { bookingService } from "@/services/booking.service";
import { authService } from "@/services/auth.service";
import { prisma } from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await authService.getSession();
    const sessionToken = req.cookies.get("barber_session_token")?.value;

    let activeBooking = null;

    if (session?.userId) {
      activeBooking = await prisma.booking.findFirst({
        where: {
          userId: session.userId,
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING_VERIFICATION] },
        },
        include: {
          items: true,
          slot: true,
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (sessionToken) {
      activeBooking = await bookingService.getActiveBookingBySessionToken(sessionToken);
    }

    if (!activeBooking) {
      // Check if user is in cancellation cooldown
      const { getCancellationCooldownHours } = await import("@/lib/settings");
      const cooldownHours = await getCancellationCooldownHours();

      if (cooldownHours > 0) {
        const cancelledCookie = req.cookies.get("barber_cancelled_at")?.value;
        let cancelledAtMs = cancelledCookie ? parseInt(cancelledCookie, 10) : 0;

        // Also check DB for recent cancellation
        const { hashToken } = await import("@/lib/crypto");
        const hashedToken = sessionToken ? hashToken(sessionToken) : undefined;

        const dbCancelled = await prisma.booking.findFirst({
          where: {
            status: BookingStatus.CANCELLED,
            OR: [
              ...(session?.userId ? [{ userId: session.userId }] : []),
              ...(hashedToken ? [{ sessionTokenHash: hashedToken }] : []),
            ],
          },
          orderBy: { updatedAt: "desc" },
        });

        if (dbCancelled) {
          const dbTime = new Date(dbCancelled.updatedAt).getTime();
          if (dbTime > cancelledAtMs) {
            cancelledAtMs = dbTime;
          }
        }

        if (cancelledAtMs > 0) {
          const cooldownDurationMs = cooldownHours * 60 * 60 * 1000;
          const unlockTimeMs = cancelledAtMs + cooldownDurationMs;
          const now = Date.now();

          if (now < unlockTimeMs) {
            const remainingSeconds = Math.ceil((unlockTimeMs - now) / 1000);
            return NextResponse.json({
              hasActiveBooking: false,
              isBlocked: true,
              blockedUntil: new Date(unlockTimeMs).toISOString(),
              remainingSeconds,
              cooldownHours,
            });
          }
        }
      }

      return NextResponse.json({ hasActiveBooking: false, isBlocked: false });
    }

    return NextResponse.json({
      hasActiveBooking: true,
      booking: {
        id: activeBooking.id,
        bookingNumber: activeBooking.bookingNumber,
        guestName: activeBooking.guestName,
        guestPhone: activeBooking.guestPhone,
        date: activeBooking.date,
        startTime: activeBooking.startTime,
        endTime: activeBooking.endTime,
        totalDurationMinutes: activeBooking.totalDurationMinutes,
        totalPriceMinorUnits: activeBooking.totalPriceMinorUnits,
        status: activeBooking.status,
        items: activeBooking.items.map((item) => ({
          nameSnapshot: item.nameSnapshot,
          priceSnapshotMinor: item.priceSnapshotMinor,
          durationSnapshotMin: item.durationSnapshotMin,
        })),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error checking active booking";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
