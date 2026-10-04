const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('Fetching future days...');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const days = await prisma.availabilityDay.findMany({
    where: { date: { gte: todayStr } },
    include: { slots: true }
  });

  console.log(`Found ${days.length} future days.`);

  for (const day of days) {
    if (!day.isOpen) continue;
    
    // Find earliest and latest slots to determine working hours
    if (day.slots.length === 0) continue;
    
    const startTimes = day.slots.map(s => s.startTime).sort();
    const endTimes = day.slots.map(s => s.endTime).sort();
    
    const minStart = startTimes[0];
    const maxEnd = endTimes[endTimes.length - 1];

    console.log(`Day ${day.date}: current working hours ${minStart} - ${maxEnd}`);

    // Drop all AVAILABLE slots for this day
    await prisma.availabilitySlot.deleteMany({
      where: {
        availabilityDayId: day.id,
        status: 'AVAILABLE'
      }
    });

    console.log(`Deleted unbooked slots for ${day.date}. Regenerating 15-minute slots...`);
    
    // Generate 15-minute intervals
    const [startH, startM] = minStart.split(":").map(Number);
    const [endH, endM] = maxEnd.split(":").map(Number);
    
    let currentMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const slotDurationMinutes = 15;

    while (currentMinutes + slotDurationMinutes <= endMinutes) {
      const slotStartH = Math.floor(currentMinutes / 60).toString().padStart(2, "0");
      const slotStartM = (currentMinutes % 60).toString().padStart(2, "0");
      const slotStart = `${slotStartH}:${slotStartM}`;

      const slotEndMinutes = currentMinutes + slotDurationMinutes;
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
        update: {
          endTime: slotEnd,
          status: 'AVAILABLE',
        },
        create: {
          availabilityDayId: day.id,
          startTime: slotStart,
          endTime: slotEnd,
          status: 'AVAILABLE',
        },
      });

      currentMinutes += slotDurationMinutes;
    }
    console.log(`Successfully regenerated slots for ${day.date}.`);
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
