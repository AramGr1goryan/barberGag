const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dates = ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08'];
  
  for (const dateStr of dates) {
    // delete old slots
    const day = await prisma.availabilityDay.findUnique({ where: { date: dateStr } });
    if (day) {
      await prisma.availabilitySlot.deleteMany({ where: { availabilityDayId: day.id } });
      
      const slotsToCreate = [];
      for (let h = 10; h <= 22; h++) {
        for (let m = 0; m < 60; m += 15) {
          const start = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
          
          let endH = h;
          let endM = m + 15;
          if (endM >= 60) {
            endH += 1;
            endM -= 60;
          }
          const end = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
          
          slotsToCreate.push({
            availabilityDayId: day.id,
            startTime: start,
            endTime: end,
            status: 'AVAILABLE'
          });
        }
      }
      
      await prisma.availabilitySlot.createMany({ data: slotsToCreate });
      console.log(`Re-generated slots for ${dateStr}`);
    }
  }
}

main().finally(() => prisma.$disconnect());
