const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function timeToMin(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function getAvailableStartSlots(daySlots, durationMinutes, todayYerevanStr, currentHourMin, dateStr) {
  const availableCandidates = daySlots.filter(s => {
    if (s.status !== "AVAILABLE") return false;
    if (s.booking && s.booking.status !== "CANCELLED") return false;
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
          console.log(`Candidate ${candidate.startTime} OVERLAPS with ${slot.startTime}-${slot.endTime} (status: ${slot.status})`);
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

async function main() {
  const day = await prisma.availabilityDay.findFirst({
    where: { date: '2026-10-04' },
    include: {
      slots: {
        include: {
          booking: { select: { id: true, status: true } },
        },
        orderBy: { startTime: "asc" },
      },
    },
  });
  
  if (!day) return console.log("Day not found");
  
  const res = getAvailableStartSlots(day.slots, 15, "2020-01-01", "00:00", "2026-10-04");
  console.log("Available 15m slots starting from 13:00:");
  console.log(res.filter(s => s.startTime >= "13:00" && s.startTime <= "15:00").map(s => s.startTime));
}

main().finally(() => prisma.$disconnect());
