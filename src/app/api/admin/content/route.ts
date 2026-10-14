import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/services/auth.service";
import { adminService } from "@/services/admin.service";
import { handleApiError, apiSuccess } from "@/lib/api-response";

export async function GET() {
  try {
    await authService.requireAdmin();
    const contents = await adminService.getSiteContent();
    return NextResponse.json({ contents });
  } catch (error: unknown) {
    return handleApiError(error, "Failed to load site content", 403);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await authService.requireAdmin();
    const body = await req.json();
    const { key, section, valueHy, valueRu, valueEn } = body;

    if (!key || !section) {
      return NextResponse.json({ error: "Key and section required" }, { status: 400 });
    }

    const content = await adminService.upsertSiteContent(key, section, {
      hy: valueHy,
      ru: valueRu,
      en: valueEn,
    });

    await adminService.logAudit({
      actorId: session.userId,
      actorEmail: session.phone,
      action: "UPDATE_SITE_CONTENT",
      entity: "SiteContent",
      entityId: key,
    });

    return apiSuccess({ content });
  } catch (error: unknown) {
    return handleApiError(error, "Error updating site content", 400);
  }
}
