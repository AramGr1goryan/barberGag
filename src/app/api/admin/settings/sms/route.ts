import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/services/auth.service";
import { prisma } from "@/lib/prisma";
import { smsService } from "@/services/sms.service";

export async function GET() {
  try {
    await authService.requireAdmin();

    const envProvider = process.env.SMS_PROVIDER || "console";
    let dbConfig = null;

    try {
      const record = await prisma.siteContent.findUnique({
        where: { key: "sms_provider_config" },
      });
      if (record && record.valueEn) {
        dbConfig = JSON.parse(record.valueEn);
      }
    } catch {
      // ignore
    }

    const activeProvider = dbConfig?.provider || envProvider;

    return NextResponse.json({
      activeProvider,
      hasEnvConfig: Boolean(
        process.env.NIKITA_LOGIN ||
        process.env.SMS_LOGIN ||
        process.env.SMSRU_API_KEY ||
        process.env.MOBIPACE_API_KEY ||
        process.env.SMS_ACCOUNT_ID
      ),
      hasDbConfig: Boolean(dbConfig),
      senderId: dbConfig?.from || process.env.SMS_FROM || "BarberGag",
      providerDetails: {
        provider: activeProvider,
        login: dbConfig?.login ? `${dbConfig.login.slice(0, 3)}***` : undefined,
        apiKey: dbConfig?.apiKey ? `${dbConfig.apiKey.slice(0, 4)}***` : undefined,
      },
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
    const { provider, login, password, apiKey, accountSid, authToken, from, gatewayUrl, testPhone } = body;

    // 1. If updating configuration
    if (provider) {
      const configObj = {
        provider,
        login: login || undefined,
        password: password || undefined,
        apiKey: apiKey || undefined,
        accountSid: accountSid || undefined,
        authToken: authToken || undefined,
        from: from || "BarberGag",
        gatewayUrl: gatewayUrl || undefined,
      };

      await prisma.siteContent.upsert({
        where: { key: "sms_provider_config" },
        update: {
          valueHy: JSON.stringify(configObj),
          valueRu: JSON.stringify(configObj),
          valueEn: JSON.stringify(configObj),
          section: "settings",
        },
        create: {
          key: "sms_provider_config",
          valueHy: JSON.stringify(configObj),
          valueRu: JSON.stringify(configObj),
          valueEn: JSON.stringify(configObj),
          section: "settings",
        },
      });
    }

    // 2. If sending a test SMS
    if (testPhone) {
      const activeProvider = await smsService.getEffectiveProvider();
      const testMsg = "Թեստային հաղորդագրություն Barber Gagik Ghambaryan ամրագրման համակարգից:";
      const sent = await activeProvider.sendSms(testPhone, testMsg);

      return NextResponse.json({
        success: sent,
        message: sent
          ? `Թեստային SMS-ը հաջողությամբ ուղարկվեց ${testPhone} համարին`
          : `Չհաջողվեց ուղարկել SMS: Ստուգեք մուտքանունը / API բանալին:`,
      });
    }

    return NextResponse.json({ success: true, message: "Настройки SMS успешно сохранены!" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
