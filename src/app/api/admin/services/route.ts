import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authService } from "@/services/auth.service";
import { adminService } from "@/services/admin.service";

export async function GET() {
  try {
    await authService.requireAdmin();
    const [services, addons] = await Promise.all([
      prisma.service.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.addon.findMany({ orderBy: { sortOrder: "asc" } }),
    ]);
    return NextResponse.json({ services, addons });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await authService.requireAdmin();
    const body = await req.json();
    const { type, data } = body;

    if (type === "service") {
      const service = await prisma.service.create({
        data: {
          nameHy: data.nameHy,
          nameRu: data.nameRu,
          nameEn: data.nameEn,
          descriptionHy: data.descriptionHy,
          descriptionRu: data.descriptionRu,
          descriptionEn: data.descriptionEn,
          durationMinutes: Number(data.durationMinutes),
          priceMinorUnits: Number(data.priceMinorUnits),
          active: data.active ?? true,
          sortOrder: Number(data.sortOrder || 0),
        },
      });

      await adminService.logAudit({
        actorId: session.userId,
        actorEmail: session.phone,
        action: "CREATE_SERVICE",
        entity: "Service",
        entityId: service.id,
      });

      return NextResponse.json({ success: true, service });
    }

    if (type === "addon") {
      const addon = await prisma.addon.create({
        data: {
          nameHy: data.nameHy,
          nameRu: data.nameRu,
          nameEn: data.nameEn,
          durationMinutes: Number(data.durationMinutes),
          priceMinorUnits: Number(data.priceMinorUnits),
          active: data.active ?? true,
          sortOrder: Number(data.sortOrder || 0),
        },
      });

      await adminService.logAudit({
        actorId: session.userId,
        actorEmail: session.phone,
        action: "CREATE_ADDON",
        entity: "Addon",
        entityId: addon.id,
      });

      return NextResponse.json({ success: true, addon });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error creating item";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await authService.requireAdmin();
    const body = await req.json();
    const { type, id, data } = body;

    if (type === "service") {
      const updated = await prisma.service.update({
        where: { id },
        data: {
          nameHy: data.nameHy,
          nameRu: data.nameRu,
          nameEn: data.nameEn,
          descriptionHy: data.descriptionHy,
          descriptionRu: data.descriptionRu,
          descriptionEn: data.descriptionEn,
          durationMinutes: Number(data.durationMinutes),
          priceMinorUnits: Number(data.priceMinorUnits),
          active: data.active,
          sortOrder: Number(data.sortOrder),
        },
      });

      await adminService.logAudit({
        actorId: session.userId,
        actorEmail: session.phone,
        action: "UPDATE_SERVICE",
        entity: "Service",
        entityId: id,
      });

      return NextResponse.json({ success: true, updated });
    }

    if (type === "addon") {
      const updated = await prisma.addon.update({
        where: { id },
        data: {
          nameHy: data.nameHy,
          nameRu: data.nameRu,
          nameEn: data.nameEn,
          durationMinutes: Number(data.durationMinutes),
          priceMinorUnits: Number(data.priceMinorUnits),
          active: data.active,
          sortOrder: Number(data.sortOrder),
        },
      });

      await adminService.logAudit({
        actorId: session.userId,
        actorEmail: session.phone,
        action: "UPDATE_ADDON",
        entity: "Addon",
        entityId: id,
      });

      return NextResponse.json({ success: true, updated });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error updating item";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await authService.requireAdmin();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    if (!id || !type) {
      return NextResponse.json({ error: "ID and type required" }, { status: 400 });
    }

    if (type === "service") {
      await prisma.service.delete({ where: { id } });
    } else if (type === "addon") {
      await prisma.addon.delete({ where: { id } });
    }

    await adminService.logAudit({
      actorId: session.userId,
      actorEmail: session.phone,
      action: `DELETE_${type.toUpperCase()}`,
      entity: type === "service" ? "Service" : "Addon",
      entityId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error deleting item";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
