const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const day = await prisma.availabilityDay.findUnique({
    where: { date: '2026-10-05' },
    include: { slots: { orderBy: { startTime: 'asc' } } }
  });
  console.log(day.slots.map(s => s.startTime).join(', '));
}
main().finally(() => prisma.$disconnect());
