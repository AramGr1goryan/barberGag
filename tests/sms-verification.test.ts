import { describe, it, expect } from "vitest";
import {
  generateVerificationCode,
  generateSalt,
  hashVerificationCode,
} from "../src/lib/crypto";

describe("SMS Verification & Cryptography", () => {
  it("should generate a 6-digit numeric verification code", () => {
    const code = generateVerificationCode();
    expect(code).toHaveLength(6);
    expect(/^\d{6}$/.test(code)).toBe(true);
  });

  it("should generate random unique salts", () => {
    const salt1 = generateSalt();
    const salt2 = generateSalt();
    expect(salt1).not.toBe(salt2);
    expect(salt1.length).toBeGreaterThanOrEqual(16);
  });

  it("should deterministically hash OTP code with salt", () => {
    const code = "482910";
    const salt = "test_salt_123456";
    const hash1 = hashVerificationCode(code, salt);
    const hash2 = hashVerificationCode(code, salt);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 hex output
  });

  it("should produce completely different hashes for different codes with same salt", () => {
    const salt = "fixed_salt_constant";
    const hashA = hashVerificationCode("123456", salt);
    const hashB = hashVerificationCode("654321", salt);

    expect(hashA).not.toBe(hashB);
  });

  it("should produce completely different hashes for same code with different salts", () => {
    const code = "889900";
    const hashA = hashVerificationCode(code, "salt_A");
    const hashB = hashVerificationCode(code, "salt_B");

    expect(hashA).not.toBe(hashB);
  });
});
