import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/services/auth.service";
import { adminService } from "@/services/admin.service";
import { getCancellationCooldownHours, setCancellationCooldownHours } from "@/lib/settings";

export async function GET() {
  try {
    await authService.requireAdmin();
    const cooldownHours = await getCancellationCooldownHours();
    return NextResponse.json({ cooldownHours });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unauthorized or error";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await authService.requireAdmin();
    const body = await req.json();
    const cooldownHours = await setCancellationCooldownHours(body.cooldownHours);

    await adminService.logAudit({
      actorId: session.userId,
      actorEmail: session.phone,
      action: "UPDATE_COOLDOWN_SETTINGS",
      entity: "SiteContent",
      metadata: { cancellation_cooldown_hours: cooldownHours },
    });

    return NextResponse.json({ success: true, cooldownHours });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error updating cooldown";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

