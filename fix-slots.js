const fs = require('fs');
const path = require('path');
const p = path.join('c:', 'barber', 'src', 'services', 'availability.service.ts');
let content = fs.readFileSync(p, 'utf8');

// Fix bulkGenerateSlots
content = content.replace(
  /const slot = await prisma\.availabilitySlot\.upsert\(\{\s+where: \{\s+availabilityDayId_startTime: \{\s+availabilityDayId: day\.id,\s+startTime: slotStart,\s+\},\s+\},\s+update: \{\s+endTime: slotEnd,\s+status: SlotStatus\.AVAILABLE,\s+\},\s+create: \{\s+availabilityDayId: day\.id,\s+startTime: slotStart,\s+endTime: slotEnd,\s+status: SlotStatus\.AVAILABLE,\s+\},\s+\}\);/g,
  `const existingSlot = await prisma.availabilitySlot.findUnique({
        where: {
          availabilityDayId_startTime: {
            availabilityDayId: day.id,
            startTime: slotStart,
          },
        },
      });

      let slot;
      if (existingSlot) {
        if (existingSlot.status === SlotStatus.AVAILABLE) {
          slot = await prisma.availabilitySlot.update({
            where: { id: existingSlot.id },
            data: { endTime: slotEnd },
          });
        } else {
          slot = existingSlot;
        }
      } else {
        slot = await prisma.availabilitySlot.create({
          data: {
            availabilityDayId: day.id,
            startTime: slotStart,
            endTime: slotEnd,
            status: SlotStatus.AVAILABLE,
          },
        });
      }`
);

// Fix createSingleSlot
content = content.replace(
  /const slot = await prisma\.availabilitySlot\.upsert\(\{\s+where: \{\s+availabilityDayId_startTime: \{\s+availabilityDayId: day\.id,\s+startTime,\s+\},\s+\},\s+update: \{\s+endTime,\s+status: SlotStatus\.AVAILABLE,\s+\},\s+create: \{\s+availabilityDayId: day\.id,\s+startTime,\s+endTime,\s+status: SlotStatus\.AVAILABLE,\s+\},\s+\}\);/g,
  `const existingSlot = await prisma.availabilitySlot.findUnique({
      where: {
        availabilityDayId_startTime: {
          availabilityDayId: day.id,
          startTime,
        },
      },
    });

    let slot;
    if (existingSlot) {
      if (existingSlot.status === SlotStatus.AVAILABLE) {
        slot = await prisma.availabilitySlot.update({
          where: { id: existingSlot.id },
          data: { endTime },
        });
      } else {
        slot = existingSlot;
      }
    } else {
      slot = await prisma.availabilitySlot.create({
        data: {
          availabilityDayId: day.id,
          startTime,
          endTime,
          status: SlotStatus.AVAILABLE,
        },
      });
    }`
);

fs.writeFileSync(p, content, 'utf8');
console.log('Replaced correctly');
