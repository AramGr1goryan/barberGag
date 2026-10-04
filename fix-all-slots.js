const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAllActiveBookingsSlots() {
  const activeBookings = await prisma.booking.findMany({
    where: { status: { not: "CANCELLED" } },
    include: { slots: true }
  });

  for (const b of activeBookings) {
    const { id, date, startTime, totalDurationMinutes } = b;
    
    // Calculate slots needed
    const durMin = Number(totalDurationMinutes) || 60;
    const slotsNeeded = Math.ceil(durMin / 15);
    const [startH, startM] = startTime.split(":").map(Number);
    const startTotalMin = startH * 60 + startM;

    // Ensure day exists
    const day = await prisma.availabilityDay.upsert({
      where: { date },
      update: { isOpen: true },
      create: { date, isOpen: true },
    });

    const slotIds = [];
    for (let i = 0; i < slotsNeeded; i++) {
      const currentSlotMinutes = startTotalMin + i * 15;
      const currentSlotEndMinutes = currentSlotMinutes + 15;
      
      const cH = Math.floor(currentSlotMinutes / 60).toString().padStart(2, "0");
      const cM = (currentSlotMinutes % 60).toString().padStart(2, "0");
      const cEndH = Math.floor(currentSlotEndMinutes / 60).toString().padStart(2, "0");
      const cEndM = (currentSlotEndMinutes % 60).toString().padStart(2, "0");
      
      const slotStart = cH + ":" + cM;
      const slotEnd = cEndH + ":" + cEndM;
      
      const slot = await prisma.availabilitySlot.upsert({
        where: {
          availabilityDayId_startTime: {
            availabilityDayId: day.id,
            startTime: slotStart,
          }
        },
        update: {
          status: 'BOOKED',
          endTime: slotEnd
        },
        create: {
          availabilityDayId: day.id,
          startTime: slotStart,
          endTime: slotEnd,
          status: 'BOOKED'
        }
      });
      slotIds.push(slot.id);
    }

    // Connect them to the booking
    await prisma.booking.update({
      where: { id },
      data: {
        slots: {
          connect: slotIds.map(sid => ({ id: sid }))
        }
      }
    });

    console.log("Fixed booking " + b.bookingNumber + " (" + date + " " + startTime + " - " + durMin + "m), connected " + slotIds.length + " slots.");
  }
}

fixAllActiveBookingsSlots().then(() => console.log("Done")).catch(console.error);
