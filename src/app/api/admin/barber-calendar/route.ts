import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authService } from "@/services/auth.service";
import { adminService } from "@/services/admin.service";
import { BookingStatus, SlotStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    await authService.requireAdmin();
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");
    const isLite = searchParams.get("lite") === "true";

    // 1. Fetch all open days (from past 7 days to next 60 days)
    const today = new Date();
    today.setDate(today.getDate() - 7);
    const pastCutoff = today.toISOString().split("T")[0];

    let openDays: any[] = [];
    let services: any[] = [];

    if (!isLite) {
      const openDaysRecords = await prisma.availabilityDay.findMany({
        where: {
          isOpen: true,
          date: { gte: pastCutoff },
        },
        include: {
          slots: {
            select: { id: true, status: true, startTime: true, endTime: true },
          },
        },
        orderBy: { date: "asc" },
      });

      const allBookings = await prisma.booking.findMany({
        where: {
          date: { gte: pastCutoff },
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED, BookingStatus.PENDING_VERIFICATION] },
        },
        select: { id: true, date: true, status: true },
      });

      const bookingsByDate: Record<string, { total: number; completed: number }> = {};
      for (const b of allBookings) {
        if (!bookingsByDate[b.date]) bookingsByDate[b.date] = { total: 0, completed: 0 };
        bookingsByDate[b.date].total++;
        if (b.status === BookingStatus.COMPLETED) bookingsByDate[b.date].completed++;
      }

      openDays = openDaysRecords.map((d) => {
        const dayBookings = bookingsByDate[d.date] || { total: 0, completed: 0 };
        const availableSlotsCount = d.slots.filter((s) => s.status === SlotStatus.AVAILABLE).length;
        return {
          id: d.id,
          date: d.date,
          isOpen: d.isOpen,
          notes: d.notes,
          totalSlots: d.slots.length,
          availableSlots: availableSlotsCount,
          totalBookings: dayBookings.total,
          completedBookings: dayBookings.completed,
        };
      });

      services = await prisma.service.findMany({
        where: { active: true },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true, nameRu: true, nameHy: true, nameEn: true, priceMinorUnits: true, durationMinutes: true,
        },
      });
    }

    // 3. If a specific date is requested, get its full details, slots, and bookings
    let selectedDayDetails = null;
    if (dateParam) {
      const day = await prisma.availabilityDay.findUnique({
        where: { date: dateParam },
        include: {
          slots: {
            orderBy: { startTime: "asc" },
          },
        },
      });

      const dayBookings = await prisma.booking.findMany({
        where: {
          date: dateParam,
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED, BookingStatus.PENDING_VERIFICATION, BookingStatus.CANCELLED] },
        },
        include: {
          items: true,
          slots: true,
        },
        orderBy: { startTime: "asc" },
      });

      selectedDayDetails = {
        date: dateParam,
        isOpen: day ? day.isOpen : false,
        slots: day?.slots || [],
        bookings: dayBookings,
      };
    }

    return NextResponse.json({
      openDays,
      services,
      selectedDayDetails,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unauthorized or error";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await authService.requireAdmin();
    const body = await req.json();
    const { action } = body;

    // 1. Toggle task completed status
    if (action === "toggleTask") {
      const { bookingId, completed } = body;
      if (!bookingId) {
        return NextResponse.json({ error: "Booking ID required" }, { status: 400 });
      }

      const newStatus = completed ? BookingStatus.COMPLETED : BookingStatus.CONFIRMED;

      const updated = await prisma.booking.update({
        where: { id: bookingId },
        data: { status: newStatus },
        include: { items: true, slots: true },
      });

      await adminService.logAudit({
        actorId: session.userId,
        actorEmail: session.phone,
        action: completed ? "TASK_COMPLETED" : "TASK_UNCOMPLETED",
        entity: "Booking",
        entityId: bookingId,
        metadata: { newStatus },
      });

      return NextResponse.json({ success: true, booking: updated });
    }
    // 1.5. Cancel Booking
    if (action === "cancelBooking") {
      const { bookingId } = body;
      if (!bookingId) return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
      
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { slots: true }
      });
      if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

      // Cancel booking and free slots
      await prisma.$transaction(async (tx) => {
        await tx.booking.update({
          where: { id: bookingId },
          data: { status: BookingStatus.CANCELLED }
        });
        
        if (booking.slots && booking.slots.length > 0) {
          await tx.availabilitySlot.updateMany({
            where: {
              id: { in: booking.slots.map(s => s.id) }
            },
            data: { status: SlotStatus.AVAILABLE }
          });
        }
      });

      await adminService.logAudit({
        actorId: session.userId,
        actorEmail: session.phone,
        action: "BOOKING_CANCELLED",
        entity: "Booking",
        entityId: bookingId,
        metadata: { status: "CANCELLED" },
      });

      return NextResponse.json({ success: true });
    }

    // 2. Manual Client Booking by Barber
    
    if (action === "editManualBooking") {
      const { bookingId, date, startTime, durationMinutes, guestName, guestPhone, serviceId, serviceName, price } = body;
      
      const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { slots: true, items: true } });
      if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

      // Free old slots
      if (booking.slots.length > 0) {
        await prisma.availabilitySlot.updateMany({
          where: { id: { in: booking.slots.map(s => s.id) } },
          data: { status: "AVAILABLE" }
        });
      }

      const [startH, startM] = startTime.split(":").map(Number);
      const startTotalMin = startH * 60 + startM;
      const durMin = Number(durationMinutes) || 60;
      const endTotalMin = startTotalMin + durMin;
      const endH = Math.floor(endTotalMin / 60).toString().padStart(2, "0");
      const endM = (endTotalMin % 60).toString().padStart(2, "0");
      const calculatedEndTime = `${endH}:${endM}`;

      const day = await prisma.availabilityDay.upsert({
        where: { date },
        update: { isOpen: true },
        create: { date, isOpen: true },
      });

      const slotsNeeded = Math.ceil(durMin / 15);
      const createdSlotIds = [];
      for (let i = 0; i < slotsNeeded; i++) {
        const currentSlotMinutes = startTotalMin + i * 15;
        const currentSlotEndMinutes = currentSlotMinutes + 15;
        const cH = Math.floor(currentSlotMinutes / 60).toString().padStart(2, "0");
        const cM = (currentSlotMinutes % 60).toString().padStart(2, "0");
        const cEndH = Math.floor(currentSlotEndMinutes / 60).toString().padStart(2, "0");
        const cEndM = (currentSlotEndMinutes % 60).toString().padStart(2, "0");
        const slotStart = `${cH}:${cM}`;
        const slotEnd = `${cEndH}:${cEndM}`;
        
        const slot = await prisma.availabilitySlot.upsert({
          where: { availabilityDayId_startTime: { availabilityDayId: day.id, startTime: slotStart } },
          update: { status: "BOOKED", endTime: slotEnd },
          create: { availabilityDayId: day.id, startTime: slotStart, endTime: slotEnd, status: "BOOKED" }
        });
        createdSlotIds.push(slot.id);
      }

      const priceMinor = Math.round(Number(price) * 100);
      const finalServiceId = (serviceId && serviceId !== "CUSTOM") ? serviceId : null;
      
      // Update booking and disconnect old slots, connect new
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          guestName: guestName || booking.guestName,
          guestPhone: guestPhone || booking.guestPhone,
          date,
          startTime,
          endTime: calculatedEndTime,
          totalDurationMinutes: durMin,
          totalPriceMinorUnits: priceMinor,
          slots: {
            set: createdSlotIds.map(id => ({ id }))
          },
          items: {
            deleteMany: {},
            create: [
              {
                nameSnapshot: serviceName || "Услуга мастера",
                priceSnapshotMinor: priceMinor,
                durationSnapshotMin: durMin,
                itemType: "SERVICE",
                serviceId: finalServiceId,
              }
            ]
          }
        }
      });

      return NextResponse.json({ success: true });
    }

    if (action === "createManualBooking") {
      const {
        date,
        startTime,
        durationMinutes = 60,
        guestName,
        guestPhone,
        serviceName,
        serviceId,
        price = 0,
      } = body;

      const bookingDate =
        date && /^\d{4}-\d{2}-\d{2}$/.test(date)
          ? date
          : new Date().toISOString().split("T")[0];
      const startT =
        startTime && /^([01]\d|2[0-3]):[0-5]\d$/.test(startTime)
          ? startTime
          : "12:00";
      const finalGuestName = guestName?.trim() || "Клиент";
      const finalGuestPhone = guestPhone?.trim() || "—";

      const durMin = Math.max(15, Math.min(240, Number(durationMinutes) || 60));
      const [startH, startM] = startT.split(":").map(Number);
      const startTotalMin = startH * 60 + startM;
      const endTotalMin = startTotalMin + durMin;

      const endH = Math.floor(endTotalMin / 60).toString().padStart(2, "0");
      const endM = (endTotalMin % 60).toString().padStart(2, "0");
      const calculatedEndTime = `${endH}:${endM}`;

      // 1. Ensure Day exists and is Open
      const day = await prisma.availabilityDay.upsert({
        where: { date: bookingDate },
        update: { isOpen: true },
        create: { date: bookingDate, isOpen: true },
      });

      const slotsNeeded = Math.ceil(durMin / 15);
      
      const createdSlotIds = [];
      for (let i = 0; i < slotsNeeded; i++) {
        const currentSlotMinutes = startTotalMin + i * 15;
        const currentSlotEndMinutes = currentSlotMinutes + 15;
        
        const cH = Math.floor(currentSlotMinutes / 60).toString().padStart(2, "0");
        const cM = (currentSlotMinutes % 60).toString().padStart(2, "0");
        const cEndH = Math.floor(currentSlotEndMinutes / 60).toString().padStart(2, "0");
        const cEndM = (currentSlotEndMinutes % 60).toString().padStart(2, "0");
        
        const slotStart = `${cH}:${cM}`;
        const slotEnd = `${cEndH}:${cEndM}`;
        
        const slot = await prisma.availabilitySlot.upsert({
          where: {
            availabilityDayId_startTime: {
              availabilityDayId: day.id,
              startTime: slotStart,
            }
          },
          update: {
            status: SlotStatus.BOOKED,
            endTime: slotEnd
          },
          create: {
            availabilityDayId: day.id,
            startTime: slotStart,
            endTime: slotEnd,
            status: SlotStatus.BOOKED
          }
        });
        createdSlotIds.push(slot.id);
      }

      // 3. Generate Booking Number
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const bookingNumber = `BK-${bookingDate.replace(/-/g, "")}-${randomSuffix}`;
      const priceMinor = Math.round(Number(price) * 100);

      const finalServiceId = (serviceId && serviceId !== "CUSTOM") ? serviceId : null;

      // 4. Create Booking
      const booking = await prisma.booking.create({
        data: {
          bookingNumber,
          guestName: finalGuestName,
          guestPhone: finalGuestPhone,
          date: bookingDate,
          startTime: startT,
          endTime: calculatedEndTime,
          totalDurationMinutes: durMin,
          totalPriceMinorUnits: priceMinor,
          status: BookingStatus.CONFIRMED,
          slots: {
            connect: createdSlotIds.map(id => ({ id }))
          },
          items: {
            create: [
              {
                nameSnapshot: serviceName || "Услуга мастера",
                priceSnapshotMinor: priceMinor,
                durationSnapshotMin: durMin,
                itemType: "SERVICE",
                serviceId: finalServiceId,
              },
            ],
          },
        },
        include: {
          items: true,
          slots: true,
        },
      });

      // 5. Send Telegram notification
      const { telegramService } = await import("@/services/telegram.service");
      try {
        await telegramService.notifyNewBooking(booking.id);
      } catch (err) {
        console.error("Failed to send telegram notification for manual booking:", err);
      }

      await adminService.logAudit({
        actorId: session.userId === "env-admin" ? undefined : session.userId,
        actorEmail: session.phone || session.userId,
        action: "MANUAL_BOOKING_CREATED",
        entity: "Booking",
        entityId: booking.id,
        metadata: { date, startTime, guestName, guestPhone },
      });

      return NextResponse.json({ success: true, booking });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error processing request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
