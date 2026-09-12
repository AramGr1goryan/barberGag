import { NextRequest, NextResponse } from "next/server";
import { profileService } from "@/services/profile.service";
import { authService } from "@/services/auth.service";
import { updateProfileSchema } from "@/validators/profile.schema";

export async function GET() {
  try {
    const session = await authService.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await profileService.getUserProfile(session.userId);
    const bookings = await profileService.getUserBookings(session.userId);

    return NextResponse.json({ user, bookings });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error fetching profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await authService.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = updateProfileSchema.parse(body);

    const updated = await profileService.updateProfile(session.userId, validated);

    return NextResponse.json({ success: true, profile: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error updating profile";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
