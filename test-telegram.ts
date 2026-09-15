import { telegramService } from './src/services/telegram.service';
telegramService.sendMessage('test message')
  .then((res) => console.log('Success:', res))
  .catch((err) => console.error('Error:', err));
