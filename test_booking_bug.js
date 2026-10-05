const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dateStr = '2026-10-10'; // future date

  // 1. Initialize day
  let day = await prisma.availabilityDay.findUnique({ where: { date: dateStr }, include: { slots: true } });
  if (!day) {
    day = await prisma.availabilityDay.create({ data: { date: dateStr, isOpen: true } });
    const slots = [];
    for (let i = 10 * 60; i < 24 * 60; i += 15) {
      const h = Math.floor(i / 60).toString().padStart(2, '0');
      const m = (i % 60).toString().padStart(2, '0');
      const eh = Math.floor((i+15)/60).toString().padStart(2, '0');
      const em = ((i+15)%60).toString().padStart(2, '0');
      slots.push({ availabilityDayId: day.id, startTime: `${h}:${m}`, endTime: `${eh}:${em}`, status: 'AVAILABLE' });
    }
    await prisma.availabilitySlot.createMany({ data: slots });
  }

  // 2. Book 13:00 for 30 minutes
  day = await prisma.availabilityDay.findUnique({ where: { date: dateStr }, include: { slots: true } });
  const s1 = day.slots.find(s => s.startTime === '13:00');
  const s2 = day.slots.find(s => s.startTime === '13:15');

  const booking = await prisma.booking.create({
    data: {
      bookingNumber: 'TEST1234',
      date: dateStr,
      startTime: '13:00',
      endTime: '13:30',
      totalDurationMinutes: 30,
      totalPriceMinorUnits: 3000,
      status: 'CONFIRMED',
      guestName: 'Test',
      guestPhone: '123',
      guestRealPhone: '123',
      sessionTokenHash: 'abc',
      slots: { connect: [{ id: s1.id }, { id: s2.id }] }
    }
  });

  await prisma.availabilitySlot.updateMany({
    where: { id: { in: [s1.id, s2.id] } },
    data: { status: 'BOOKED' }
  });

  // 3. Test availability for 15 mins
  const { availabilityService } = require('./src/services/availability.service');
  const res = await availabilityService.getPublicAvailabilityForDate(dateStr, 15);
  
  console.log("Available slots from 13:00 to 14:00:", res.slots.filter(s => s.startTime >= '13:00' && s.startTime <= '14:00').map(s => s.startTime));
}

main().finally(() => prisma.$disconnect());
