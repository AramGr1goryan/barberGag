const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBookings() {
  const d = await prisma.booking.findMany({
    include: { slots: true }
  });
  console.dir(d, { depth: null });
}
checkBookings();
