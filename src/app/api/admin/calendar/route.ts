import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/services/auth.service";
import { availabilityService } from "@/services/availability.service";
import { adminService } from "@/services/admin.service";
import {
  toggleDayStatusSchema,
  createSlotSchema,
  bulkGenerateSlotsSchema,
  updateSlotStatusSchema,
} from "@/validators/availability.schema";

export async function GET(req: NextRequest) {
  try {
    await authService.requireAdmin();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const month = searchParams.get("month");

    const { prisma } = await import("@/lib/prisma");

    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const days = await prisma.availabilityDay.findMany({
        where: {
          date: {
            startsWith: month,
          },
        },
        include: {
          slots: {
            select: {
              id: true,
              status: true,
            },
          },
        },
        orderBy: { date: "asc" },
      });
      return NextResponse.json({ days });
    }

    if (!date) {
      return NextResponse.json({ error: "Date parameter required" }, { status: 400 });
    }

    const dayDetails = await availabilityService.getAdminDayDetails(date);
    return NextResponse.json(dayDetails);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error fetching calendar";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await authService.requireAdmin();
    const body = await req.json();
    const { action } = body;

    if (action === "toggleDay" || action === "setDayStatus") {
      const date = body.date;
      const isOpen = Boolean(body.isOpen);
      const notes = body.notes;

      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
      }

      const day = await availabilityService.setDayOpenStatus(date, isOpen, notes);

      await adminService.logAudit({
        actorId: session.userId,
        actorEmail: session.phone,
        action: isOpen ? "OPEN_DAY" : "CLOSE_DAY",
        entity: "AvailabilityDay",
        entityId: day.id,
        metadata: { date },
      });

      return NextResponse.json({ success: true, day });
    }

    if (action === "createSlot" || action === "openSlot") {
      const date = body.date;
      const startTime = body.startTime;
      const durationMinutes = Number(body.durationMinutes || body.slotDurationMinutes || 60);

      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
      }
      if (!startTime || !/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime)) {
        return NextResponse.json({ error: "Invalid time format (HH:mm)" }, { status: 400 });
      }

      const { day, slot } = await availabilityService.createSingleSlot(
        date,
        startTime,
        durationMinutes
      );

      await adminService.logAudit({
        actorId: session.userId,
        actorEmail: session.phone,
        action: "CREATE_SINGLE_SLOT",
        entity: "AvailabilitySlot",
        entityId: slot.id,
        metadata: {
          date,
          startTime,
          endTime: slot.endTime,
          durationMinutes,
        },
      });

      return NextResponse.json({ success: true, day, slot });
    }

    if (action === "bulkGenerate" || action === "generateSlots") {
      const date = body.date;
      const startTime = body.startTime;
      const endTime = body.endTime;
      const slotDurationMinutes = Number(body.slotDurationMinutes || body.slotDuration || 60);

      const validated = bulkGenerateSlotsSchema.parse({
        date,
        startTime,
        endTime,
        slotDurationMinutes,
      });

      const slots = await availabilityService.bulkGenerateSlots(
        validated.date,
        validated.startTime,
        validated.endTime,
        validated.slotDurationMinutes
      );

      await adminService.logAudit({
        actorId: session.userId,
        actorEmail: session.phone,
        action: "BULK_GENERATE_SLOTS",
        entity: "AvailabilitySlot",
        metadata: {
          date: validated.date,
          count: slots.length,
          timeRange: `${validated.startTime}-${validated.endTime}`,
        },
      });

      return NextResponse.json({
        success: true,
        count: slots.length,
        createdCount: slots.length,
        slots,
      });
    }

    if (action === "updateSlotStatus") {
      const validated = updateSlotStatusSchema.parse(body);
      const slot = await availabilityService.updateSlotStatus(validated.slotId, validated.status);

      await adminService.logAudit({
        actorId: session.userId,
        actorEmail: session.phone,
        action: `UPDATE_SLOT_${validated.status}`,
        entity: "AvailabilitySlot",
        entityId: validated.slotId,
      });

      return NextResponse.json({ success: true, slot });
    }

    if (action === "deleteSlot") {
      const { slotId } = body;
      await availabilityService.deleteSlot(slotId);

      await adminService.logAudit({
        actorId: session.userId,
        actorEmail: session.phone,
        action: "DELETE_SLOT",
        entity: "AvailabilitySlot",
        entityId: slotId,
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error processing calendar action";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
