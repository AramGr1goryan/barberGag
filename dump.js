const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const services = await prisma.service.findMany();
  const addons = await prisma.addon.findMany();
  console.log("SERVICES:", JSON.stringify(services, null, 2));
  console.log("ADDONS:", JSON.stringify(addons, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
