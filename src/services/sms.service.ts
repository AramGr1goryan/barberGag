import { prisma } from "@/lib/prisma";
import { generateSalt, generateVerificationCode, hashVerificationCode } from "@/lib/crypto";
import { BookingStatus, SlotStatus } from "@prisma/client";
import fs from "fs";
import path from "path";

export interface SmsProvider {
  sendSms(to: string, message: string): Promise<boolean>;
}

export class ConsoleSmsProvider implements SmsProvider {
  async sendSms(to: string, message: string): Promise<boolean> {
    console.log("==================================================");
    console.log(`[SMS DEV MODE] Sent to: ${to}`);
    console.log(`[SMS DEV MODE] Message: ${message}`);
    console.log("==================================================");
    return true;
  }
}

/**
 * Nikita Mobile Armenia (smspro.nikita.am)
 * Leading SMS aggregator in Armenia for +374 numbers
 */
export class NikitaSmsProvider implements SmsProvider {
  private login: string;
  private password: string;
  private originator: string;

  constructor(login: string, password: string, originator: string = "BarberGag") {
    this.login = login;
    this.password = password;
    this.originator = originator;
  }

  async sendSms(to: string, message: string): Promise<boolean> {
    try {
      const cleanPhone = to.replace(/[^0-9]/g, "");
      const params = new URLSearchParams({
        login: this.login,
        password: this.password,
        phones: cleanPhone,
        text: message,
        sender: this.originator,
      });

      const endpoint = `https://smspro.nikita.am/api/send?${params.toString()}`;
      const response = await fetch(endpoint, { method: "GET", cache: "no-store" });
      const text = await response.text();
      console.log(`[Nikita SMS] Sent to ${cleanPhone}, response:`, text);
      return response.ok && !text.toLowerCase().includes("error");
    } catch (error) {
      console.error("Nikita SMS send error:", error);
      return false;
    }
  }
}

/**
 * SMS.ru Provider (International SMS Gateway, supports Armenia +374)
 */
export class SmsRuProvider implements SmsProvider {
  private apiKey: string;
  private from?: string;

  constructor(apiKey: string, from?: string) {
    this.apiKey = apiKey;
    this.from = from;
  }

  async sendSms(to: string, message: string): Promise<boolean> {
    try {
      const cleanPhone = to.replace(/[^0-9]/g, "");
      const params = new URLSearchParams({
        api_id: this.apiKey,
        to: cleanPhone,
        msg: message,
        json: "1",
      });
      if (this.from) params.append("from", this.from);

      const response = await fetch(`https://sms.ru/sms/send?${params.toString()}`, { cache: "no-store" });
      const data = await response.json();
      console.log(`[SMS.ru] Sent to ${cleanPhone}, response:`, data);
      return data?.status === "OK";
    } catch (error) {
      console.error("SMS.ru send error:", error);
      return false;
    }
  }
}

/**
 * Mobipace / SMS.am Provider (Armenia)
 */
export class MobipaceSmsProvider implements SmsProvider {
  private apiKey: string;
  private sender: string;

  constructor(apiKey: string, sender: string = "BarberGag") {
    this.apiKey = apiKey;
    this.sender = sender;
  }

  async sendSms(to: string, message: string): Promise<boolean> {
    try {
      const cleanPhone = to.replace(/[^0-9]/g, "");
      const response = await fetch("https://api.mobipace.com/api/v1/sms/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        cache: "no-store",
        body: JSON.stringify({
          phone: cleanPhone,
          text: message,
          sender: this.sender,
        }),
      });
      return response.ok;
    } catch (error) {
      console.error("Mobipace send error:", error);
      return false;
    }
  }
}

/**
 * Twilio SMS Provider
 */
export class TwilioSmsProvider implements SmsProvider {
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor(accountSid: string, authToken: string, fromNumber: string) {
    this.accountSid = accountSid;
    this.authToken = authToken;
    this.fromNumber = fromNumber;
  }

  async sendSms(to: string, message: string): Promise<boolean> {
    try {
      const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
      const body = new URLSearchParams({
        To: to,
        From: this.fromNumber,
        Body: message,
      });

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        cache: "no-store",
        body: body.toString(),
      });

      return response.ok;
    } catch (error) {
      console.error("Twilio SMS send error:", error);
      return false;
    }
  }
}

/**
 * Generic HTTP Gateway (supports any Armenian/International SMS webhook)
 */
export class GenericHttpSmsProvider implements SmsProvider {
  private gatewayUrl: string;

  constructor(gatewayUrl: string) {
    this.gatewayUrl = gatewayUrl;
  }

  async sendSms(to: string, message: string): Promise<boolean> {
    try {
      const cleanPhone = to.replace(/[^0-9]/g, "");
      if (this.gatewayUrl.includes("{to}") || this.gatewayUrl.includes("{phone}")) {
        const url = this.gatewayUrl
          .replace("{to}", cleanPhone)
          .replace("{phone}", cleanPhone)
          .replace("{text}", encodeURIComponent(message))
          .replace("{message}", encodeURIComponent(message));
        const res = await fetch(url, { cache: "no-store" });
        return res.ok;
      } else {
        const res = await fetch(this.gatewayUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({ to: cleanPhone, phone: cleanPhone, message, text: message }),
        });
        return res.ok;
      }
    } catch (error) {
      console.error("Generic SMS gateway error:", error);
      return false;
    }
  }
}

export function getSmsProvider(): SmsProvider {
  const providerType = (process.env.SMS_PROVIDER || "console").toLowerCase();

  // 1. Nikita Mobile Armenia
  if (
    providerType === "nikita" ||
    (process.env.NIKITA_LOGIN && process.env.NIKITA_PASSWORD) ||
    (process.env.SMS_LOGIN && process.env.SMS_PASSWORD)
  ) {
    const login = process.env.NIKITA_LOGIN || process.env.SMS_LOGIN || "";
    const password = process.env.NIKITA_PASSWORD || process.env.SMS_PASSWORD || "";
    const from = process.env.SMS_FROM || "BarberGag";
    return new NikitaSmsProvider(login, password, from);
  }

  // 2. SMS.ru
  if (providerType === "smsru" || process.env.SMSRU_API_KEY) {
    const apiKey = process.env.SMSRU_API_KEY || process.env.SMS_API_KEY || "";
    return new SmsRuProvider(apiKey, process.env.SMS_FROM);
  }

  // 3. Mobipace / SMS.am
  if (providerType === "mobipace" || process.env.MOBIPACE_API_KEY) {
    const apiKey = process.env.MOBIPACE_API_KEY || process.env.SMS_API_KEY || "";
    return new MobipaceSmsProvider(apiKey, process.env.SMS_FROM || "BarberGag");
  }

  // 4. Twilio
  if (providerType === "twilio" && process.env.SMS_ACCOUNT_ID && process.env.SMS_AUTH_TOKEN) {
    return new TwilioSmsProvider(
      process.env.SMS_ACCOUNT_ID,
      process.env.SMS_AUTH_TOKEN,
      process.env.SMS_FROM || ""
    );
  }

  // 5. Generic Custom Gateway URL
  if (process.env.SMS_GATEWAY_URL) {
    return new GenericHttpSmsProvider(process.env.SMS_GATEWAY_URL);
  }

  return new ConsoleSmsProvider();
}

export interface SmsVerificationResult {
  success: boolean;
  status: "SUCCESS" | "INVALID_CODE" | "EXPIRED" | "MAX_ATTEMPTS_EXCEEDED" | "NOT_FOUND" | "RATE_LIMITED";
  message?: string;
  attemptsLeft?: number;
  redirectToHome?: boolean;
  resendAvailableInSeconds?: number;
}

export class SmsService {
  private provider: SmsProvider;

  constructor(provider?: SmsProvider) {
    this.provider = provider || getSmsProvider();
  }

  /**
   * Helper to load dynamic config from SiteContent DB if saved by admin
   */
  async getEffectiveProvider(): Promise<SmsProvider> {
    try {
      const configRecord = await prisma.siteContent.findUnique({
        where: { key: "sms_provider_config" },
      });
      if (configRecord && configRecord.valueEn) {
        const cfg = JSON.parse(configRecord.valueEn);
        if (cfg.provider === "nikita" && cfg.login && cfg.password) {
          return new NikitaSmsProvider(cfg.login, cfg.password, cfg.from || "BarberGag");
        }
        if (cfg.provider === "smsru" && cfg.apiKey) {
          return new SmsRuProvider(cfg.apiKey, cfg.from);
        }
        if (cfg.provider === "mobipace" && cfg.apiKey) {
          return new MobipaceSmsProvider(cfg.apiKey, cfg.from || "BarberGag");
        }
        if (cfg.provider === "twilio" && cfg.accountSid && cfg.authToken) {
          return new TwilioSmsProvider(cfg.accountSid, cfg.authToken, cfg.from || "");
        }
        if (cfg.provider === "generic" && cfg.gatewayUrl) {
          return new GenericHttpSmsProvider(cfg.gatewayUrl);
        }
      }
    } catch {
      // ignore
    }
    return this.provider;
  }

  /**
   * Generates, hashes, stores, and sends an SMS verification code for a booking.
   * Also forwards the code to Telegram as an instant delivery fallback.
   */
  async sendVerificationCode(bookingId: string, phone: string, locale: string = "hy"): Promise<{
    success: boolean;
    error?: string;
    resendAvailableInSeconds?: number;
  }> {
    const now = new Date();
    const existing = await prisma.smsVerification.findUnique({
      where: { bookingId },
    });

    if (existing && existing.resendAvailableAt > now) {
      const cooldownSec = Math.ceil((existing.resendAvailableAt.getTime() - now.getTime()) / 1000);
      return {
        success: false,
        error: "RESEND_COOLDOWN",
        resendAvailableInSeconds: cooldownSec,
      };
    }

    const code = generateVerificationCode();
    const salt = generateSalt();
    const codeHash = hashVerificationCode(code, salt);
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes
    const resendAvailableAt = new Date(now.getTime() + 60 * 1000); // 60s cooldown

    // Log OTP to dedicated file and terminal for testing/pre-release inspection
    try {
      const timestamp = new Date().toLocaleString("ru-RU", { timeZone: "Asia/Yerevan" });
      const logEntry = `[${timestamp}] Phone: ${phone} | OTP: ${code} | BookingId: ${bookingId}\n`;
      
      const logFilePath = path.resolve(process.cwd(), "otp_codes.log");
      try {
        fs.appendFileSync(logFilePath, logEntry, "utf8");
      } catch {}

      console.log("\n=======================================================");
      console.log(`🔑 [OTP VERIFICATION CODE]`);
      console.log(`📱 Phone: ${phone}`);
      console.log(`🔢 CODE: >>> ${code} <<<`);
      console.log(`📁 Saved to: ${logFilePath}`);
      console.log("=======================================================\n");
    } catch (logErr) {
      console.error("Failed to write to otp_codes.log:", logErr);
    }

    await prisma.smsVerification.upsert({
      where: { bookingId },
      update: {
        codeHash,
        salt,
        expiresAt,
        attempts: 0,
        resendAvailableAt,
        phone,
      },
      create: {
        bookingId,
        phone,
        codeHash,
        salt,
        expiresAt,
        attempts: 0,
        maxAttempts: 3,
        resendAvailableAt,
      },
    });

    const messagesByLocale: Record<string, string> = {
      hy: `Ձեր հաստատման կոդն է՝ ${code}: Կոդը գործում է 10 րոպե: Barber Gagik Ghambaryan`,
      ru: `Ваш проверочный код: ${code}. Код действителен 10 минут. Barber Gagik Ghambaryan`,
      en: `Your verification code is: ${code}. Valid for 10 minutes. Barber Gagik Ghambaryan`,
    };

    const text = messagesByLocale[locale] || messagesByLocale.hy;

    // 1. Send SMS through configured cellular SMS gateway
    const activeProvider = await this.getEffectiveProvider();
    const sent = await activeProvider.sendSms(phone, text);

    // 2. Real-Time Backup: ALWAYS forward OTP directly to Master's Telegram Bot
    try {
      const { telegramService } = await import("./telegram.service");
      await telegramService.sendMessage(
        [
          `🔑 <b>[SMS / OTP ՀԱՍՏԱՏՄԱՆ ԿՈԴ]</b>`,
          `━━━━━━━━━━━━━━━━━━━━`,
          `📱 <b>Հեռախոսահամար՝</b> <code>${phone}</code>`,
          `🔢 <b>Հաստատման կոդ՝</b> <b><code>${code}</code></b>`,
          `⏳ <i>Կոդը գործում է 10 րոպե</i>`,
          `━━━━━━━━━━━━━━━━━━━━`,
          `📍 <i>Ամրագրում № <code>${bookingId.slice(0, 8)}</code></i>`,
        ].join("\n")
      );
    } catch (tgErr) {
      console.error("Failed to forward OTP to Telegram:", tgErr);
    }

    return {
      success: sent,
      resendAvailableInSeconds: 60,
    };
  }

  /**
   * Validates the submitted verification code and transitions booking to CONFIRMED.
   * If 3 incorrect attempts are reached, cancels the booking and frees the slot.
   */
  async verifyCode(bookingId: string, code: string): Promise<SmsVerificationResult> {
    const record = await prisma.smsVerification.findUnique({
      where: { bookingId },
      include: { booking: true },
    });

    if (!record) {
      return { success: false, status: "NOT_FOUND" };
    }

    const now = new Date();

    if (record.attempts >= record.maxAttempts) {
      return {
        success: false,
        status: "MAX_ATTEMPTS_EXCEEDED",
        attemptsLeft: 0,
        redirectToHome: true,
      };
    }

    if (now > record.expiresAt) {
      return { success: false, status: "EXPIRED" };
    }

    const expectedHash = hashVerificationCode(code, record.salt);
    if (expectedHash !== record.codeHash) {
      const updated = await prisma.smsVerification.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });

      const currentAttempts = updated.attempts;
      const attemptsLeft = Math.max(0, record.maxAttempts - currentAttempts);

      if (currentAttempts >= record.maxAttempts) {
        // 3 failed attempts: Cancel booking and release slot
        await prisma.$transaction(async (tx) => {
          await tx.booking.update({
            where: { id: bookingId },
            data: {
              status: BookingStatus.CANCELLED,
              cancellationReason: "Failed SMS verification 3 times",
              slotId: null,
            },
          });
          if (record.booking.slotId) {
            await tx.availabilitySlot.update({
              where: { id: record.booking.slotId },
              data: { status: SlotStatus.AVAILABLE },
            });
          }
        });

        return {
          success: false,
          status: "MAX_ATTEMPTS_EXCEEDED",
          attemptsLeft: 0,
          redirectToHome: true,
        };
      }

      return {
        success: false,
        status: "INVALID_CODE",
        attemptsLeft,
      };
    }

    // Code matches! Atomic transaction to confirm booking and mark slot BOOKED
    try {
      await prisma.$transaction(async (tx) => {
        // Find the slot based on the booking's requested date and time
        const slot = await tx.availabilitySlot.findFirst({
          where: {
            availabilityDay: { date: record.booking.date },
            startTime: record.booking.startTime,
            status: SlotStatus.AVAILABLE,
          },
        });

        if (!slot) {
          throw new Error("SLOT_TAKEN");
        }

        await tx.smsVerification.update({
          where: { id: record.id },
          data: { verifiedAt: now },
        });

        await tx.booking.update({
          where: { id: bookingId },
          data: { 
            status: BookingStatus.CONFIRMED,
            slotId: slot.id 
          },
        });

        await tx.availabilitySlot.update({
          where: { id: slot.id },
          data: { 
            status: SlotStatus.BOOKED,
            version: { increment: 1 },
          },
        });
      });
    } catch (e) {
      if (e instanceof Error && e.message === "SLOT_TAKEN") {
        return { 
          success: false, 
          status: "NOT_FOUND", // Re-using an existing error code mapped in route.ts, but let's use a standard response
          message: "Извините, это время уже было занято кем-то другим пока вы вводили код." 
        };
      }
      throw e;
    }

    // Send Telegram notification with full client details
    const { telegramService } = await import("./telegram.service");
    try {
      await telegramService.notifyNewBooking(bookingId);
    } catch (err) {
      console.error("Failed to send telegram notification:", err);
    }

    return { success: true, status: "SUCCESS" };
  }
}

export const smsService = new SmsService();
