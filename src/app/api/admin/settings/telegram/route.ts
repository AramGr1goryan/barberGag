import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/services/auth.service";
import { telegramService } from "@/services/telegram.service";

export async function GET() {
  try {
    await authService.requireAdmin();
    const chatId = await telegramService.getChatId();

    return NextResponse.json({
      botUsername: "@barberGag_bot",
      chatId: chatId || "",
      isConfigured: Boolean(chatId),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await authService.requireAdmin();
    const body = await req.json();
    const { chatId, testMessage } = body;

    if (chatId) {
      await telegramService.saveChatId(chatId.trim());
    }

    if (testMessage) {
      const activeChatId = chatId || (await telegramService.getChatId());
      if (!activeChatId) {
        return NextResponse.json(
          {
            error:
              "Chat ID не найден. Откройте в Telegram @barberGag_bot, нажмите /start, затем повторите.",
          },
          { status: 400 }
        );
      }

      const result = await telegramService.sendMessage(
        `💈 <b>ԹԵՍՏԱՅԻՆ ԾԱՆՈՒՑՈՒՄ</b>\n\n<b>@barberGag_bot</b> բոտը հաջողությամբ միացված է ամրագրման համակարգին:\nԲոլոր նոր ամրագրումները, չեղարկումները և հետադարձ կապի հարցումները կստացվեն այստեղ:`,
        activeChatId
      );

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: "Тестовое сообщение успешно отправлено!",
        chatId: activeChatId,
      });
    }

    const currentChatId = await telegramService.getChatId();
    return NextResponse.json({ success: true, chatId: currentChatId });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
