require('dotenv').config();
const { emailService } = require('./src/services/email.service');

async function sendTestReminders() {
  const email = "gagikgambaryan23@gmail.com";
  const bookingDetails = { startTime: "14:00", locale: "ru", date: "2026-10-15", endTime: "15:00", services: "Premium Haircut", bookingNumber: "BK-1234" }; 

  console.log("Sending Confirmation email...");
  await emailService.sendConfirmation(email, bookingDetails);

  console.log("Finished sending tests.");
}

sendTestReminders();
