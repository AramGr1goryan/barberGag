import { NextRequest, NextResponse } from "next/server";
import { storageService } from "@/services/storage.service";
import { authService } from "@/services/auth.service";

export async function POST(req: NextRequest) {
  try {
    const session = await authService.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must not exceed 5MB" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileUrl = await storageService.uploadFile(buffer, file.name, file.type);

    return NextResponse.json({ success: true, url: fileUrl });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
