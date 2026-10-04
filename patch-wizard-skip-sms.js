const fs = require('fs');

const wizardPath = 'c:/barber/src/components/booking/BookingWizard.tsx';
let code = fs.readFileSync(wizardPath, 'utf8');

// Replace setCurrentStep(4) with conditional logic
const newLogic = `
      setCreatedBookingId(data.bookingId);
      setCreatedBookingNumber(data.bookingNumber);
      if (data.verificationRequired) {
        setResendCooldown(60);
        setCurrentStep(4); // Move to SMS verification
      } else {
        setCurrentStep(5); // Move to Success directly
      }
`;
code = code.replace(/setCreatedBookingId\(data\.bookingId\);\s*setCreatedBookingNumber\(data\.bookingNumber\);\s*setResendCooldown\(60\);\s*setCurrentStep\(4\);\s*\/\/ Move to SMS verification/g, newLogic);

fs.writeFileSync(wizardPath, code);
console.log("Patched BookingWizard.tsx");
