import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authService } from "@/services/auth.service";
import { adminService } from "@/services/admin.service";

export async function GET() {
  try {
    await authService.requireAdmin();
    const items = await prisma.portfolioImage.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ items });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await authService.requireAdmin();
    const body = await req.json();

    const item = await prisma.portfolioImage.create({
      data: {
        url: body.url,
        titleHy: body.titleHy,
        titleRu: body.titleRu,
        titleEn: body.titleEn,
        altHy: body.titleHy,
        altRu: body.titleRu,
        altEn: body.titleEn,
        category: body.category || "classic",
      },
    });

    await adminService.logAudit({
      actorId: session.userId,
      actorEmail: session.phone,
      action: "UPLOAD_PORTFOLIO_IMAGE",
      entity: "PortfolioImage",
      entityId: item.id,
    });

    return NextResponse.json({ success: true, item });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error adding image";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await authService.requireAdmin();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    await prisma.portfolioImage.delete({ where: { id } });

    await adminService.logAudit({
      actorId: session.userId,
      actorEmail: session.phone,
      action: "DELETE_PORTFOLIO_IMAGE",
      entity: "PortfolioImage",
      entityId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error deleting image";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
