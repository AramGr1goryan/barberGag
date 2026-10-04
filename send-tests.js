const { emailService } = require('./src/services/email.service');

async function sendTestReminders() {
  const email = "gagikgambaryan23@gmail.com";
  const bookingDetails = { startTime: "14:00", locale: "ru" }; // Use ru or hy for the test

  console.log("Sending 2 hour reminder...");
  await emailService.sendReminder(email, bookingDetails, "2h");
  
  console.log("Sending 1 hour reminder...");
  await emailService.sendReminder(email, bookingDetails, "1h");

  console.log("Sending 20 min reminder...");
  await emailService.sendReminder(email, bookingDetails, "20m");

  console.log("Finished sending test reminders.");
}

sendTestReminders();
