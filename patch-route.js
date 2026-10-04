const fs = require('fs');
const path = require('path');

const filePath = 'c:/barber/src/app/api/admin/calendar/route.ts';
let code = fs.readFileSync(filePath, 'utf8');

const blockRangeLogic = `
    if (action === "blockRange") {
      const date = body.date;
      const startTime = body.startTime;
      const endTime = body.endTime;

      if (!date || !startTime || !endTime) {
        return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
      }

      const { prisma } = await import("@/lib/prisma");
      const day = await prisma.availabilityDay.findUnique({ where: { date } });
      if (!day) return NextResponse.json({ error: "Day not found" }, { status: 404 });

      await prisma.availabilitySlot.updateMany({
        where: {
          availabilityDayId: day.id,
          startTime: { gte: startTime, lt: endTime },
          status: "AVAILABLE",
        },
        data: { status: "BLOCKED" },
      });

      await adminService.logAudit({
        actorId: session.userId,
        actorEmail: session.phone,
        action: "BLOCK_RANGE",
        entity: "AvailabilityDay",
        entityId: day.id,
        metadata: { date, startTime, endTime },
      });

      return NextResponse.json({ success: true });
    }

    if (action === "deleteSlot") {`;

code = code.replace(/if\s*\(action\s*===\s*"deleteSlot"\)\s*\{/, blockRangeLogic);

fs.writeFileSync(filePath, code);
console.log("Added blockRange to route.ts");
