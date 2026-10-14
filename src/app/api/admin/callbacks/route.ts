import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/services/auth.service";
import { adminService } from "@/services/admin.service";
import { CallbackStatus } from "@prisma/client";
import { handleApiError, apiSuccess } from "@/lib/api-response";

export async function GET() {
  try {
    await authService.requireAdmin();
    const callbacks = await adminService.getCallbackRequests();
    return NextResponse.json({ callbacks });
  } catch (error: unknown) {
    return handleApiError(error, "Failed to load callback requests", 403);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await authService.requireAdmin();
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Callback ID and status required" }, { status: 400 });
    }

    const updated = await adminService.updateCallbackStatus(id, status as CallbackStatus);

    await adminService.logAudit({
      actorId: session.userId,
      actorEmail: session.phone,
      action: `CALLBACK_STATUS_${status}`,
      entity: "CallbackRequest",
      entityId: id,
    });

    return apiSuccess({ callback: updated });
  } catch (error: unknown) {
    return handleApiError(error, "Error updating callback", 400);
  }
}
