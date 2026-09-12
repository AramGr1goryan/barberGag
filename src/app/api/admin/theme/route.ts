import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/services/auth.service";
import { adminService } from "@/services/admin.service";
import { updateThemeSchema } from "@/validators/theme.schema";

export async function GET() {
  try {
    const theme = await adminService.getThemeSettings();
    return NextResponse.json({ theme });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error fetching theme";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await authService.requireAdmin();
    const body = await req.json();
    const validated = updateThemeSchema.parse(body);

    const updated = await adminService.updateThemeSettings(validated);

    await adminService.logAudit({
      actorId: session.userId,
      actorEmail: session.phone,
      action: "UPDATE_THEME_SETTINGS",
      entity: "ThemeSettings",
      metadata: validated,
    });

    return NextResponse.json({ success: true, theme: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error updating theme";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
