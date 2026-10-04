const fs = require('fs');
const path = require('path');
const p = path.join('c:', 'barber', 'src', 'app', 'api', 'admin', 'barber-calendar', 'route.ts');
let content = fs.readFileSync(p, 'utf8');

if (!content.includes('action === "editManualBooking"')) {
  const codeToAdd = `
    if (action === "editManualBooking") {
      const { bookingId, date, startTime, durationMinutes, guestName, guestPhone, serviceId, serviceName, price } = body;
      
      const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { slots: true, items: true } });
      if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

      // Free old slots
      if (booking.slots.length > 0) {
        await prisma.availabilitySlot.updateMany({
          where: { id: { in: booking.slots.map(s => s.id) } },
          data: { status: "AVAILABLE" }
        });
      }

      const [startH, startM] = startTime.split(":").map(Number);
      const startTotalMin = startH * 60 + startM;
      const durMin = Number(durationMinutes) || 60;
      const endTotalMin = startTotalMin + durMin;
      const endH = Math.floor(endTotalMin / 60).toString().padStart(2, "0");
      const endM = (endTotalMin % 60).toString().padStart(2, "0");
      const calculatedEndTime = \`\${endH}:\${endM}\`;

      const day = await prisma.availabilityDay.upsert({
        where: { date },
        update: { isOpen: true },
        create: { date, isOpen: true },
      });

      const slotsNeeded = Math.ceil(durMin / 15);
      const createdSlotIds = [];
      for (let i = 0; i < slotsNeeded; i++) {
        const currentSlotMinutes = startTotalMin + i * 15;
        const currentSlotEndMinutes = currentSlotMinutes + 15;
        const cH = Math.floor(currentSlotMinutes / 60).toString().padStart(2, "0");
        const cM = (currentSlotMinutes % 60).toString().padStart(2, "0");
        const cEndH = Math.floor(currentSlotEndMinutes / 60).toString().padStart(2, "0");
        const cEndM = (currentSlotEndMinutes % 60).toString().padStart(2, "0");
        const slotStart = \`\${cH}:\${cM}\`;
        const slotEnd = \`\${cEndH}:\${cEndM}\`;
        
        const slot = await prisma.availabilitySlot.upsert({
          where: { availabilityDayId_startTime: { availabilityDayId: day.id, startTime: slotStart } },
          update: { status: "BOOKED", endTime: slotEnd },
          create: { availabilityDayId: day.id, startTime: slotStart, endTime: slotEnd, status: "BOOKED" }
        });
        createdSlotIds.push(slot.id);
      }

      const priceMinor = Math.round(Number(price) * 100);
      const finalServiceId = (serviceId && serviceId !== "CUSTOM") ? serviceId : null;
      
      // Update booking and disconnect old slots, connect new
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          guestName: guestName || booking.guestName,
          guestPhone: guestPhone || booking.guestPhone,
          date,
          startTime,
          endTime: calculatedEndTime,
          totalDurationMinutes: durMin,
          totalPriceMinorUnits: priceMinor,
          slots: {
            set: createdSlotIds.map(id => ({ id }))
          },
          items: {
            deleteMany: {},
            create: [
              {
                nameSnapshot: serviceName || "Услуга мастера",
                priceSnapshotMinor: priceMinor,
                durationSnapshotMin: durMin,
                itemType: "SERVICE",
                serviceId: finalServiceId,
              }
            ]
          }
        }
      });

      return NextResponse.json({ success: true });
    }
`;
  
  content = content.replace('if (action === "createManualBooking") {', codeToAdd + '\n    if (action === "createManualBooking") {');
  fs.writeFileSync(p, content, 'utf8');
  console.log("Added editManualBooking to route.ts");
} else {
  console.log("Already added");
}
