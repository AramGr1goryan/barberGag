const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAdmins() {
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' }
  });
  console.dir(admins, { depth: null });
}
checkAdmins();
