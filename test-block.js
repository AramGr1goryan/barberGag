const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testBlockRange() {
  const date = '2026-10-04'; // use the date the user might be testing
  const startTime = '14:00';
  const endTime = '16:00';

  const day = await prisma.availabilityDay.findUnique({ where: { date } });
  if (!day) return console.log("Day not found");

  const count = await prisma.availabilitySlot.updateMany({
    where: {
      availabilityDayId: day.id,
      startTime: { gte: startTime, lt: endTime },
      status: "AVAILABLE",
    },
    data: { status: "BLOCKED" },
  });

  console.log(`Updated ${count.count} slots`);
}

testBlockRange().finally(() => prisma.$disconnect());
