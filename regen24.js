const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const days = await prisma.availabilityDay.findMany();
  for (const day of days) {
    let currentMinutes = 23 * 60; // 23:00
    const endMinutes = 24 * 60; // 24:00
    
    while (currentMinutes < endMinutes) {
      const slotStartH = Math.floor(currentMinutes / 60).toString().padStart(2, "0");
      const slotStartM = (currentMinutes % 60).toString().padStart(2, "0");
      const slotStart = `${slotStartH}:${slotStartM}`;
      
      const slotEndMinutes = currentMinutes + 15;
      const slotEndH = Math.floor(slotEndMinutes / 60).toString().padStart(2, "0");
      const slotEndM = (slotEndMinutes % 60).toString().padStart(2, "0");
      const slotEnd = `${slotEndH}:${slotEndM}`;

      await prisma.availabilitySlot.upsert({
        where: {
          availabilityDayId_startTime: {
            availabilityDayId: day.id,
            startTime: slotStart,
          },
        },
        update: {},
        create: {
          availabilityDayId: day.id,
          startTime: slotStart,
          endTime: slotEnd,
          status: "AVAILABLE",
        },
      });
      currentMinutes += 15;
    }
  }
  console.log("Added 23:00 - 24:00 slots for all existing days");
}

run().catch(console.error).finally(() => prisma.$disconnect());
