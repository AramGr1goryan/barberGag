const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixSlots() {
  // Find all active bookings
  const bookings = await prisma.booking.findMany({
    where: { status: { in: ['CONFIRMED', 'COMPLETED', 'PENDING_VERIFICATION'] } },
    include: { slots: true }
  });

  for (const b of bookings) {
    if (b.slots && b.slots.length > 0) {
      for (const s of b.slots) {
        if (s.status !== 'BOOKED') {
          console.log(`Fixing slot ${s.id} for booking ${b.bookingNumber} (${s.startTime})`);
          await prisma.availabilitySlot.update({
            where: { id: s.id },
            data: { status: 'BOOKED' }
          });
        }
      }
    }
  }
  console.log("Done");
}

fixSlots();
