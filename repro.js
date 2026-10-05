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
          console.log(`Candidate ${candidate.startTime} OVERLAPS with non-available slot ${slot.startTime}-${slot.endTime}`);
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

const daySlots = [
  { id: 1, startTime: "13:00", endTime: "13:15", status: "BOOKED", booking: { status: "CONFIRMED" } },
  { id: 2, startTime: "13:15", endTime: "13:30", status: "BOOKED", booking: { status: "CONFIRMED" } },
  { id: 3, startTime: "13:30", endTime: "13:45", status: "AVAILABLE" },
  { id: 4, startTime: "13:45", endTime: "14:00", status: "AVAILABLE" },
  { id: 5, startTime: "14:00", endTime: "14:15", status: "AVAILABLE" },
];

const res = getAvailableStartSlots(daySlots, 15, "2020-01-01", "00:00", "2020-01-02");
console.log(res.map(s => s.startTime));
