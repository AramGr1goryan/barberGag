import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { callbackSchema } from "@/validators/callback.schema";
import { checkRateLimit } from "@/lib/rate-limiter";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const rateCheck = checkRateLimit(`callback:${ip}`, 5, 60 * 60 * 1000); // 5 per hour
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many callback requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const validated = callbackSchema.parse(body);

    const request = await prisma.callbackRequest.create({
      data: {
        name: validated.name,
        phone: validated.phone,
        preferredTime: validated.preferredTime || null,
        message: validated.message || null,
      },
    });

    // Send Telegram notification for callback request
    const { telegramService } = await import("@/services/telegram.service");
    try {
      await telegramService.notifyCallbackRequest(request.id);
    } catch (err) {
      console.error("Failed to send telegram callback notification:", err);
    }

    return NextResponse.json({ success: true, id: request.id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Invalid callback data";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
