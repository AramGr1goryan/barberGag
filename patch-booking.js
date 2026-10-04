const fs = require('fs');

const bookingServicePath = 'c:/barber/src/services/booking.service.ts';
let code = fs.readFileSync(bookingServicePath, 'utf8');

// Change PENDING_VERIFICATION to CONFIRMED
code = code.replace(/status: BookingStatus\.PENDING_VERIFICATION,/g, 'status: BookingStatus.CONFIRMED,');

// Disable SMS verification sending
code = code.replace(/await smsService\.sendVerificationCode\(booking\.id, guestPhone, locale\);/g, '// await smsService.sendVerificationCode(booking.id, guestPhone, locale);');

// Return verificationRequired: false
code = code.replace(/verificationRequired: true,/g, 'verificationRequired: false,');

fs.writeFileSync(bookingServicePath, code);
console.log("Patched booking.service.ts");
