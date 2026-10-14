import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authService } from "@/services/auth.service";
import { adminService } from "@/services/admin.service";
import { revalidateTag } from "next/cache";
import { handleApiError, apiSuccess } from "@/lib/api-response";
import { Prisma } from "@prisma/client";

export async function GET() {
  try {
    await authService.requireAdmin();
    const [services, addons] = await Promise.all([
      prisma.service.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.addon.findMany({ orderBy: { sortOrder: "asc" } }),
    ]);
    return NextResponse.json({ services, addons });
  } catch (error: unknown) {
    return handleApiError(error, "Failed to load services and addons", 403);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await authService.requireAdmin();
    const body = await req.json();
    const { type, data } = body;

    if (!data) {
      return NextResponse.json({ error: "Missing item data" }, { status: 400 });
    }

    if (type === "service") {
      const nameHy = data.nameHy?.trim();
      const nameRu = data.nameRu?.trim();
      const nameEn = data.nameEn?.trim();

      if (!nameHy || !nameRu || !nameEn) {
        return NextResponse.json(
          { error: "Names in Armenian, Russian, and English are all required" },
          { status: 400 }
        );
      }

      const durationMinutes = Math.max(1, Number(data.durationMinutes) || 45);
      const priceMinorUnits = Math.max(0, Number(data.priceMinorUnits) || 0);
      const sortOrder = !isNaN(Number(data.sortOrder)) ? Number(data.sortOrder) : 0;
      const active = data.active !== undefined ? Boolean(data.active) : true;

      const service = await prisma.service.create({
        data: {
          nameHy,
          nameRu,
          nameEn,
          descriptionHy: data.descriptionHy?.trim() || "",
          descriptionRu: data.descriptionRu?.trim() || "",
          descriptionEn: data.descriptionEn?.trim() || "",
          durationMinutes,
          priceMinorUnits,
          active,
          sortOrder,
        },
      });

      await adminService.logAudit({
        actorId: session.userId,
        actorEmail: session.phone,
        action: "CREATE_SERVICE",
        entity: "Service",
        entityId: service.id,
      });

      revalidateTag("active-services");
      return apiSuccess({ service }, 201);
    }

    if (type === "addon") {
      const nameHy = data.nameHy?.trim();
      const nameRu = data.nameRu?.trim();
      const nameEn = data.nameEn?.trim();

      if (!nameHy || !nameRu || !nameEn) {
        return NextResponse.json(
          { error: "Names in Armenian, Russian, and English are all required" },
          { status: 400 }
        );
      }

      const durationMinutes = Math.max(0, Number(data.durationMinutes) || 0);
      const priceMinorUnits = Math.max(0, Number(data.priceMinorUnits) || 0);
      const sortOrder = !isNaN(Number(data.sortOrder)) ? Number(data.sortOrder) : 0;
      const active = data.active !== undefined ? Boolean(data.active) : true;

      const addon = await prisma.addon.create({
        data: {
          nameHy,
          nameRu,
          nameEn,
          durationMinutes,
          priceMinorUnits,
          active,
          sortOrder,
        },
      });

      await adminService.logAudit({
        actorId: session.userId,
        actorEmail: session.phone,
        action: "CREATE_ADDON",
        entity: "Addon",
        entityId: addon.id,
      });

      revalidateTag("active-addons");
      return apiSuccess({ addon }, 201);
    }

    return NextResponse.json({ error: "Invalid type. Must be 'service' or 'addon'" }, { status: 400 });
  } catch (error: unknown) {
    return handleApiError(error, "Failed to create service/addon", 400);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await authService.requireAdmin();
    const body = await req.json();
    const { type, id, data } = body;

    if (!id) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 });
    }

    if (!data) {
      return NextResponse.json({ error: "Missing update data" }, { status: 400 });
    }

    if (type === "service") {
      const updateData: Prisma.ServiceUpdateInput = {};

      if (data.nameHy !== undefined) updateData.nameHy = data.nameHy.trim();
      if (data.nameRu !== undefined) updateData.nameRu = data.nameRu.trim();
      if (data.nameEn !== undefined) updateData.nameEn = data.nameEn.trim();
      if (data.descriptionHy !== undefined) updateData.descriptionHy = data.descriptionHy.trim();
      if (data.descriptionRu !== undefined) updateData.descriptionRu = data.descriptionRu.trim();
      if (data.descriptionEn !== undefined) updateData.descriptionEn = data.descriptionEn.trim();

      if (data.durationMinutes !== undefined && !isNaN(Number(data.durationMinutes))) {
        updateData.durationMinutes = Math.max(1, Number(data.durationMinutes));
      }
      if (data.priceMinorUnits !== undefined && !isNaN(Number(data.priceMinorUnits))) {
        updateData.priceMinorUnits = Math.max(0, Number(data.priceMinorUnits));
      }
      if (data.active !== undefined) {
        updateData.active = Boolean(data.active);
      }
      if (data.sortOrder !== undefined && data.sortOrder !== null && !isNaN(Number(data.sortOrder))) {
        updateData.sortOrder = Number(data.sortOrder);
      }

      const updated = await prisma.service.update({
        where: { id },
        data: updateData,
      });

      await adminService.logAudit({
        actorId: session.userId,
        actorEmail: session.phone,
        action: "UPDATE_SERVICE",
        entity: "Service",
        entityId: id,
      });

      revalidateTag("active-services");
      return apiSuccess({ updated });
    }

    if (type === "addon") {
      const updateData: Prisma.AddonUpdateInput = {};

      if (data.nameHy !== undefined) updateData.nameHy = data.nameHy.trim();
      if (data.nameRu !== undefined) updateData.nameRu = data.nameRu.trim();
      if (data.nameEn !== undefined) updateData.nameEn = data.nameEn.trim();

      if (data.durationMinutes !== undefined && !isNaN(Number(data.durationMinutes))) {
        updateData.durationMinutes = Math.max(0, Number(data.durationMinutes));
      }
      if (data.priceMinorUnits !== undefined && !isNaN(Number(data.priceMinorUnits))) {
        updateData.priceMinorUnits = Math.max(0, Number(data.priceMinorUnits));
      }
      if (data.active !== undefined) {
        updateData.active = Boolean(data.active);
      }
      if (data.sortOrder !== undefined && data.sortOrder !== null && !isNaN(Number(data.sortOrder))) {
        updateData.sortOrder = Number(data.sortOrder);
      }

      const updated = await prisma.addon.update({
        where: { id },
        data: updateData,
      });

      await adminService.logAudit({
        actorId: session.userId,
        actorEmail: session.phone,
        action: "UPDATE_ADDON",
        entity: "Addon",
        entityId: id,
      });

      revalidateTag("active-addons");
      return apiSuccess({ updated });
    }

    return NextResponse.json({ error: "Invalid type. Must be 'service' or 'addon'" }, { status: 400 });
  } catch (error: unknown) {
    return handleApiError(error, "Failed to update service/addon", 400);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await authService.requireAdmin();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    if (!id || !type) {
      return NextResponse.json({ error: "ID and type are required" }, { status: 400 });
    }

    if (type === "service") {
      await prisma.service.delete({ where: { id } });
    } else if (type === "addon") {
      await prisma.addon.delete({ where: { id } });
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    await adminService.logAudit({
      actorId: session.userId,
      actorEmail: session.phone,
      action: `DELETE_${type.toUpperCase()}`,
      entity: type === "service" ? "Service" : "Addon",
      entityId: id,
    });

    if (type === "service") revalidateTag("active-services");
    else if (type === "addon") revalidateTag("active-addons");

    return apiSuccess({ success: true });
  } catch (error: unknown) {
    return handleApiError(error, "Failed to delete item", 400);
  }
}
