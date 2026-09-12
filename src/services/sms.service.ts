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
        body: body.toString(),
      });

      return response.ok;
    } catch (error) {
      console.error("Twilio SMS send error:", error);
      return false;
    }
  }
}

export function getSmsProvider(): SmsProvider {
  const provider = process.env.SMS_PROVIDER || "console";
  if (provider === "twilio" && process.env.SMS_ACCOUNT_ID && process.env.SMS_AUTH_TOKEN) {
    return new TwilioSmsProvider(
      process.env.SMS_ACCOUNT_ID,
      process.env.SMS_AUTH_TOKEN,
      process.env.SMS_FROM || ""
    );
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
   * Generates, hashes, stores, and sends an SMS verification code for a booking.
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
      hy: `Ձեր հաստատման կոդն է՝ ${code}: Կոդը գործում է 10 րոպե:`,
      ru: `Ваш проверочный код: ${code}. Код действителен 10 минут.`,
      en: `Your verification code is: ${code}. Valid for 10 minutes.`,
    };

    const text = messagesByLocale[locale] || messagesByLocale.hy;
    const sent = await this.provider.sendSms(phone, text);

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
    await prisma.$transaction(async (tx) => {
      await tx.smsVerification.update({
        where: { id: record.id },
        data: { verifiedAt: now },
      });

      await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CONFIRMED },
      });

      if (record.booking.slotId) {
        await tx.availabilitySlot.update({
          where: { id: record.booking.slotId },
          data: { status: SlotStatus.BOOKED },
        });
      }
    });

    // Send Telegram notification with full client details asynchronously
    const { telegramService } = await import("./telegram.service");
    telegramService.notifyNewBooking(bookingId).catch((err) => {
      console.error("Failed to send telegram notification:", err);
    });

    return { success: true, status: "SUCCESS" };
  }
}

export const smsService = new SmsService();
