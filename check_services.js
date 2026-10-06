const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const services = await prisma.service.findMany();
  for (const s of services) {
    console.log(`${s.nameHy} - ${s.durationMinutes} mins`);
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
