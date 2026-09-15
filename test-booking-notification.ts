import { prisma } from './src/lib/prisma';
import { telegramService } from './src/services/telegram.service';

async function test() {
  const booking = await prisma.booking.findFirst({ orderBy: { createdAt: 'desc' } });
  if (!booking) {
    console.log("No booking found");
    return;
  }
  console.log("Testing with booking:", booking.id);
  const result = await telegramService.notifyNewBooking(booking.id);
  console.log("Result:", result);
}
test().catch(console.error);
