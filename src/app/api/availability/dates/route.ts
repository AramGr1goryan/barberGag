import { NextRequest, NextResponse } from "next/server";
import { availabilityService } from "@/services/availability.service";

export const revalidate = 60;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const durationStr = searchParams.get("duration");
    const duration = durationStr ? parseInt(durationStr, 10) : 15;

    if (!start || !end) {
      return NextResponse.json({ error: "Start and end dates required" }, { status: 400 });
    }

    const openDates = await availabilityService.getOpenDates(start, end, duration);
    return NextResponse.json({ openDates });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error fetching open dates";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
