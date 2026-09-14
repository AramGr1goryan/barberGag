import { NextRequest, NextResponse } from "next/server";
import { availabilityService } from "@/services/availability.service";

export const revalidate = 15;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Invalid or missing date (YYYY-MM-DD)" }, { status: 400 });
    }

    const availability = await availabilityService.getPublicAvailabilityForDate(date);
    return NextResponse.json(availability);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error fetching availability";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
