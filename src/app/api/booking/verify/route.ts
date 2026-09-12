import { NextRequest, NextResponse } from "next/server";
import { smsService } from "@/services/sms.service";
import { verifySmsSchema } from "@/validators/booking.schema";
import { checkRateLimit } from "@/lib/rate-limiter";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const rateCheck = checkRateLimit(`booking:verify:${ip}`, 10, 5 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many verification attempts. Please wait." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const validated = verifySmsSchema.parse(body);

    const result = await smsService.verifyCode(validated.bookingId, validated.code);

    if (!result.success) {
      const errorMessages: Record<string, string> = {
        INVALID_CODE:
          typeof result.attemptsLeft === "number"
            ? `Неверный код. Осталось попыток: ${result.attemptsLeft}`
            : "Неверный проверочный код.",
        EXPIRED: "Срок действия кода истек. Запросите новый код.",
        MAX_ATTEMPTS_EXCEEDED:
          "Вы исчерпали 3 попытки ввода кода. Запись отменена.",
        NOT_FOUND: "Запись верификации не найдена.",
      };

      return NextResponse.json(
        {
          success: false,
          status: result.status,
          attemptsLeft: result.attemptsLeft,
          redirectToHome: Boolean(result.redirectToHome),
          error: errorMessages[result.status] || "Ошибка верификации.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, status: "SUCCESS" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Verification error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
