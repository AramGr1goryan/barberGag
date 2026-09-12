import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/services/auth.service";
import { fontService } from "@/services/font.service";

export async function GET() {
  try {
    await authService.requireAdmin();
    const fonts = await fontService.getFontSettings();
    return NextResponse.json({ success: true, fonts });
  } catch (err: unknown) {
    console.error("Fetch fonts error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unauthorized" },
      { status: 401 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await authService.requireAdmin();
    const body = await req.json();

    const updated = await fontService.updateFontSettings({
      fontHy: body.fontHy,
      fontRu: body.fontRu,
      fontEn: body.fontEn,
      customFontName: body.customFontName,
      customFontUrl: body.customFontUrl,
    });

    return NextResponse.json({ success: true, fonts: updated });
  } catch (err: unknown) {
    console.error("Update fonts error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to update fonts" },
      { status: 500 }
    );
  }
}
