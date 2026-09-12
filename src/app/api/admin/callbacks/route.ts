import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/services/auth.service";
import { adminService } from "@/services/admin.service";
import { CallbackStatus } from "@prisma/client";

export async function GET() {
  try {
    await authService.requireAdmin();
    const callbacks = await adminService.getCallbackRequests();
    return NextResponse.json({ callbacks });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await authService.requireAdmin();
    const body = await req.json();
    const { id, status } = body;

    const updated = await adminService.updateCallbackStatus(id, status as CallbackStatus);

    await adminService.logAudit({
      actorId: session.userId,
      actorEmail: session.phone,
      action: `CALLBACK_STATUS_${status}`,
      entity: "CallbackRequest",
      entityId: id,
    });

    return NextResponse.json({ success: true, callback: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error updating callback";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
