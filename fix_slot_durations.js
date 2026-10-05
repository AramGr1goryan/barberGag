const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function timeToMin(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function minToTime(mins) {
  const h = Math.floor(mins / 60).toString().padStart(2, '0');
  const m = (mins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

async function main() {
  const slots = await prisma.availabilitySlot.findMany();
  let fixedCount = 0;
  for (const slot of slots) {
    const startMin = timeToMin(slot.startTime);
    const endMin = timeToMin(slot.endTime);
    if (endMin - startMin > 15) {
      const correctEndMin = startMin + 15;
      const correctEndTime = minToTime(correctEndMin);
      await prisma.availabilitySlot.update({
        where: { id: slot.id },
        data: { endTime: correctEndTime }
      });
      console.log(`Fixed slot ${slot.id}: ${slot.startTime}-${slot.endTime} -> ${slot.startTime}-${correctEndTime}`);
      fixedCount++;
    }
  }
  console.log(`Fixed ${fixedCount} corrupted slots.`);
}

main().finally(() => prisma.$disconnect());
