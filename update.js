const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.availabilityDay.updateMany({
    where: { date: { gte: '2026-10-05', lte: '2026-10-08' } },
    data: { isOpen: true }
  });
  console.log("Updated!");
}
main().finally(() => prisma.$disconnect());
