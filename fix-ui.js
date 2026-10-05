const fs = require('fs');
const path = require('path');
const p = path.join('c:', 'barber', 'src', 'components', 'admin', 'BarberCalendarManager.tsx');
let content = fs.readFileSync(p, 'utf8');

// 1. Filter out overlapping available slots
const availableSlotsDecl = `const availableSlots = daySlots.filter(s => s.status === "AVAILABLE");`;
const newAvailableSlotsDecl = `const bookedSlots = daySlots.filter(s => s.status !== "AVAILABLE");
  const timeToMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const availableSlots = daySlots.filter(s => {
    if (s.status !== "AVAILABLE") return false;
    const sStart = timeToMin(s.startTime);
    const sEnd = timeToMin(s.endTime);
    const hasOverlap = bookedSlots.some(b => {
      const bStart = timeToMin(b.startTime);
      const bEnd = timeToMin(b.endTime);
      return bStart < sEnd && bEnd > sStart;
    });
    return !hasOverlap;
  });`;
content = content.replace(availableSlotsDecl, newAvailableSlotsDecl);

// 2. Fix swipe threshold (make it require a full swipe, e.g. 100)
content = content.replace(/const swipeThreshold = 40;/g, 'const swipeThreshold = 120;');
content = content.replace(/const swipeThreshold = 80;/g, 'const swipeThreshold = 120;');

fs.writeFileSync(p, content, 'utf8');
console.log('Fixed overlapping slots display and swipe threshold');
