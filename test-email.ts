import { EmailService } from './src/services/email.service';

const email = new EmailService();
async function test() {
  process.env.SMTP_HOST = "smtp.gmail.com";
  process.env.SMTP_PORT = "465";
  process.env.SMTP_SECURE = "true";
  process.env.SMTP_USER = "illuzann@gmail.com";
  process.env.SMTP_PASS = "dummy"; // We just want to see if nodemailer throws a validation error BEFORE sending
  process.env.SMTP_FROM = "Gagik Ghambaryan"; // Emulate the user's bad config
  
  try {
    const res = await email.sendConfirmation("test@example.com", { date: "2024-01-01", startTime: "10:00", endTime: "11:00", bookingNumber: "BK-123", services: "Test", locale: "hy" });
    console.log("Result:", res);
  } catch (e) {
    console.error("Error:", e);
  }
}
test();
