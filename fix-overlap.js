const fs = require('fs');
const path = require('path');
const p = path.join('c:', 'barber', 'src', 'services', 'availability.service.ts');
let content = fs.readFileSync(p, 'utf8');

const helperFunction = `
function timeToMin(timeStr: string) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function getAvailableStartSlots(daySlots: any[], durationMinutes: number, todayYerevanStr: string, currentHourMin: string, dateStr: string) {
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
    
    // 1. Check if all consecutive AVAILABLE slots exist
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

    // 2. Check for overlaps with ANY non-available or booked slot
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
`;

// Insert helper function before AvailabilityService class
if (!content.includes('function timeToMin')) {
  content = content.replace('export class AvailabilityService {', helperFunction + '\nexport class AvailabilityService {');
}

// 1. Rewrite getPublicAvailabilityForDate
const publicQueryRegex = /async getPublicAvailabilityForDate[\s\S]*?return \{\s*date: day\.date,\s*isOpen: true,\s*slots: availableStartSlots\.map\(\(s\) => \(\{\s*id: s\.id,\s*startTime: s\.startTime,\s*endTime: s\.endTime,\s*status: s\.status,\s*\}\)\),\s*\};\s*\}/;

const newPublicQuery = `async getPublicAvailabilityForDate(dateStr: string, durationMinutes: number = 15): Promise<PublicDayAvailability> {
    await this.ensureCurrentMonthInitialized();
    await this.cleanupExpiredHeldSlots();

    const day = await prisma.availabilityDay.findUnique({
      where: { date: dateStr },
      include: {
        slots: {
          include: {
            booking: { select: { id: true, status: true } },
          },
          orderBy: { startTime: "asc" },
        },
      },
    });

    if (!day || !day.isOpen) {
      return { date: dateStr, isOpen: false, slots: [] };
    }

    const { dateStr: todayYerevanStr, timeStr: currentHourMin } = getYerevanCurrentDateAndTime();
    const availableStartSlots = getAvailableStartSlots(day.slots, durationMinutes, todayYerevanStr, currentHourMin, dateStr);

    return {
      date: day.date,
      isOpen: true,
      slots: availableStartSlots.map((s) => ({
        id: s.id,
        startTime: s.startTime,
        endTime: s.endTime,
        status: s.status,
      })),
    };
  }`;
content = content.replace(publicQueryRegex, newPublicQuery);

// 2. Rewrite getOpenDates
const openDatesRegex = /async getOpenDates[\s\S]*?return days\s*\.filter\(\(d\) => \{[\s\S]*?\}\)\s*\.map\(\(d\) => d\.date\);\s*\}/;

const newOpenDates = `async getOpenDates(startDate: string, endDate: string, durationMinutes: number = 15): Promise<string[]> {
    await this.ensureCurrentMonthInitialized();
    await this.cleanupExpiredHeldSlots();

    const days = await prisma.availabilityDay.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        isOpen: true,
      },
      include: {
        slots: {
          include: {
            booking: { select: { id: true, status: true } },
          },
          orderBy: { startTime: "asc" }
        },
      },
      orderBy: { date: "asc" },
    });

    const { dateStr: todayYerevanStr, timeStr: currentHourMin } = getYerevanCurrentDateAndTime();

    return days
      .filter((d) => {
        const availableStartSlots = getAvailableStartSlots(d.slots, durationMinutes, todayYerevanStr, currentHourMin, d.date);
        return availableStartSlots.length > 0;
      })
      .map((d) => d.date);
  }`;
content = content.replace(openDatesRegex, newOpenDates);

fs.writeFileSync(p, content, 'utf8');
console.log('Fixed overlap checking in availability.service.ts');
