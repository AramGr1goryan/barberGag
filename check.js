const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const days = await prisma.availabilityDay.findMany({
    where: { date: { gte: '2026-10-05', lte: '2026-10-10' } },
    select: { date: true, isOpen: true, _count: { select: { slots: true } } }
  });
  console.log(JSON.stringify(days, null, 2));
}
main().finally(() => prisma.$disconnect());
