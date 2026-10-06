import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { availabilityService } from "@/services/availability.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || "2026-10-06";
    const duration = parseInt(searchParams.get("duration") || "15", 10);

    const day = await prisma.availabilityDay.findUnique({
      where: { date },
      include: {
        slots: {
          orderBy: { startTime: "asc" }
        }
      }
    });

    const publicAvail = await availabilityService.getPublicAvailabilityForDate(date, duration);

    return NextResponse.json({ day, publicAvail });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
