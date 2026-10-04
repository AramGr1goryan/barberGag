const fs = require('fs');
const path = require('path');
const p = path.join('c:', 'barber', 'src', 'components', 'admin', 'BarberCalendarManager.tsx');
let content = fs.readFileSync(p, 'utf8');

// Change swipeThreshold from 80 to 40
content = content.replace(/const swipeThreshold = 80;/g, 'const swipeThreshold = 40;');

fs.writeFileSync(p, content, 'utf8');
console.log('Swipe threshold updated to 40');
