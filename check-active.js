const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const d = await prisma.booking.findMany({
    where: {
      status: { not: "CANCELLED" }
    },
    include: {
      slots: true
    }
  });
  console.dir(d, { depth: null });
}
check();
