const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function timeToMin(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function getAvailableStartSlots(daySlots, durationMinutes, todayYerevanStr, currentHourMin, dateStr) {
  const availableCandidates = daySlots.filter(s => {
    if (s.status !== "AVAILABLE") return false;
    // Skip booking status check since we just rely on slot status
    if (dateStr === todayYerevanStr && s.startTime <= currentHourMin) return false;
    return true;
  });

  const slotsNeeded = Math.ceil(durationMinutes / 15);
  const result = [];

  for (const candidate of availableCandidates) {
    const candidateStartMin = timeToMin(candidate.startTime);
    const candidateEndMin = candidateStartMin + durationMinutes;
    
    let hasAllConsecutive = true;
    for (let i = 0; i < slotsNeeded; i++) {
      const neededStartMin = candidateStartMin + i * 15;
      const found = availableCandidates.find(s => timeToMin(s.startTime) === neededStartMin);
      if (!found) {
        hasAllConsecutive = false;
        break;
      }
    }
    if (!hasAllConsecutive) continue;

    let hasOverlap = false;
    for (const slot of daySlots) {
      const isAvailablePool = availableCandidates.some(s => s.id === slot.id);
      if (!isAvailablePool) {
        const slotStart = timeToMin(slot.startTime);
        const slotEnd = timeToMin(slot.endTime);
        if (slotStart < candidateEndMin && slotEnd > candidateStartMin) {
          hasOverlap = true;
          break;
        }
      }
    }

    if (!hasOverlap) {
      result.push(candidate);
    }
  }

  return result;
}

async function run() {
  const day = await prisma.availabilityDay.findFirst({
    where: { date: "2026-10-06" },
    include: {
      slots: {
        orderBy: { startTime: 'asc' }
      }
    }
  });

  if (!day) return console.log("No day");

  // Test at 12:00 Yerevan Time
  const avail = getAvailableStartSlots(day.slots, 15, "2026-10-06", "12:00", "2026-10-06");
  
  console.log("Available Slots for 15 min at 12:00 current time:");
  console.log(avail.map(s => s.startTime).join(", "));
  
  // Test at 13:46 Yerevan Time
  const avail2 = getAvailableStartSlots(day.slots, 15, "2026-10-06", "13:46", "2026-10-06");
  console.log("Available Slots for 15 min at 13:46 current time:");
  console.log(avail2.map(s => s.startTime).join(", "));
}

run().catch(console.error).finally(() => prisma.$disconnect());
