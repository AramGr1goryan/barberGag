const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const slots = await prisma.availabilitySlot.findMany({
    where: { startTime: { gte: '13:00', lte: '14:00' } },
    take: 10,
    orderBy: { createdAt: 'desc' }
  });
  console.log(slots);
}
main().finally(() => prisma.$disconnect());
