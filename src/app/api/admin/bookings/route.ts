import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authService } from "@/services/auth.service";
import { adminService } from "@/services/admin.service";
import { BookingStatus, SlotStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    await authService.requireAdmin();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const bookings = await prisma.booking.findMany({
      where: {
        date: date || undefined,
        status: status ? (status as BookingStatus) : undefined,
        OR: search
          ? [
              { guestName: { contains: search, mode: "insensitive" } },
              { guestPhone: { contains: search } },
              { bookingNumber: { contains: search, mode: "insensitive" } },
            ]
          : undefined,
      },
      include: {
        items: true,
        slot: true,
      },
      orderBy: [{ date: "desc" }, { startTime: "asc" }],
    });

    return NextResponse.json({ bookings });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unauthorized or error";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await authService.requireAdmin();
    const body = await req.json();
    const { bookingId, status, reason } = body;

    if (!bookingId || !status) {
      return NextResponse.json({ error: "Booking ID and status required" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Transactional status update
    const updated = await prisma.$transaction(async (tx) => {
      // If cancelling or marking no-show, release the slot back to AVAILABLE
      if ((status === BookingStatus.CANCELLED || status === BookingStatus.NO_SHOW) && booking.slotId) {
        await tx.availabilitySlot.update({
          where: { id: booking.slotId },
          data: { status: SlotStatus.AVAILABLE },
        });
      }

      return tx.booking.update({
        where: { id: bookingId },
        data: {
          status: status as BookingStatus,
          cancellationReason: reason || booking.cancellationReason,
        },
        include: {
          items: true,
          slot: true,
        },
      });
    });

    await adminService.logAudit({
      actorId: session.userId,
      actorEmail: session.phone,
      action: `BOOKING_STATUS_${status}`,
      entity: "Booking",
      entityId: bookingId,
      metadata: { previousStatus: booking.status, newStatus: status },
    });

    if (status === BookingStatus.CANCELLED) {
      const { telegramService } = await import("@/services/telegram.service");
      telegramService.notifyBookingCancelled(bookingId, reason).catch((err) => {
        console.error("Failed to send telegram cancellation notification:", err);
      });
    }

    return NextResponse.json({ success: true, booking: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error updating booking";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
