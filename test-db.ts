import { prisma } from './src/lib/prisma';
prisma.siteContent.findUnique({where: {key: "telegram_chat_id"}}).then(console.log).catch(console.error);
