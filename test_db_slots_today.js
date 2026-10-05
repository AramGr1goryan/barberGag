const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const day = await prisma.availabilityDay.findFirst({
    where: { date: '2026-10-05' },
    include: {
      slots: {
        where: { startTime: { gte: "13:00", lte: "14:15" } },
        orderBy: { startTime: "asc" },
      },
    },
  });
  console.log(day.slots);
}

main().finally(() => prisma.$disconnect());
