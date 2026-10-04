const fs = require('fs');
const path = require('path');
const p = path.join('c:', 'barber', 'src', 'components', 'booking', 'BookingWizard.tsx');
let content = fs.readFileSync(p, 'utf8');

// replace setSelectedSlotId(data.slots[0].id)
content = content.replace(
  /setSelectedSlotId\(data\.slots\[0\]\.id\);/g,
  'setSelectedSlotId("");'
);

// also check if we need to replace default service selection
// const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(initialServiceId ? [initialServiceId] : (services.length > 0 ? [services[0].id] : []));
content = content.replace(
  /const \[selectedServiceIds, setSelectedServiceIds\] = useState<string\[\]>\(initialServiceId \? \[initialServiceId\] : \(services\.length > 0 \? \[services\[0\]\.id\] : \[\]\)\);/g,
  'const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(initialServiceId ? [initialServiceId] : []);'
);

fs.writeFileSync(p, content, 'utf8');
console.log('Replaced in BookingWizard.tsx');
