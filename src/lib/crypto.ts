import crypto from "crypto";
import { SignJWT, jwtVerify } from "jose";

const AUTH_SECRET = process.env.AUTH_SECRET || "luxury_barbershop_production_secret_key_32bytes_min_length_value";
const encodedSecret = new TextEncoder().encode(AUTH_SECRET);

export interface UserSessionPayload {
  userId: string;
  role: "USER" | "ADMIN";
  phone: string;
  name: string;
}

/**
 * Generate cryptographically secure 6-digit numeric OTP code.
 */
export function generateVerificationCode(): string {
  const num = crypto.randomInt(100000, 999999);
  return num.toString();
}

/**
 * Hash SMS code with salt using SHA-256
 */
export function hashVerificationCode(code: string, salt: string): string {
  return crypto.createHmac("sha256", salt).update(code).digest("hex");
}

/**
 * Generate random hex salt
 */
export function generateSalt(length = 16): string {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Generate secure session token (32 random bytes)
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Hash token for safe database storage
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Generate a JWT for authenticated user
 */
export async function createAuthToken(payload: UserSessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(encodedSecret);
}

/**
 * Verify and decode a JWT
 */
export async function verifyAuthToken(token: string): Promise<UserSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodedSecret);
    return payload as unknown as UserSessionPayload;
  } catch {
    return null;
  }
}
