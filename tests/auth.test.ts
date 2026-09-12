import { describe, it, expect } from "vitest";
import bcrypt from "bcryptjs";
import { createAuthToken, verifyAuthToken } from "../src/lib/crypto";

describe("Authentication & JWT Session Security", () => {
  it("should securely hash and verify passwords using bcrypt", async () => {
    const password = "SuperSecretPassword123!";
    const hash = await bcrypt.hash(password, 10);

    expect(hash).not.toBe(password);
    const isCorrect = await bcrypt.compare(password, hash);
    expect(isCorrect).toBe(true);

    const isWrong = await bcrypt.compare("WrongPassword!", hash);
    expect(isWrong).toBe(false);
  });

  it("should sign and verify valid JWT session tokens with role payload", async () => {
    const payload = {
      userId: "usr-1234-uuid",
      role: "ADMIN" as const,
      phone: "+37491000001",
      name: "Master Barber",
    };

    const token = await createAuthToken(payload);
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);

    const verified = await verifyAuthToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe(payload.userId);
    expect(verified?.role).toBe("ADMIN");
    expect(verified?.phone).toBe(payload.phone);
  });

  it("should reject invalid or tampered JWT tokens", async () => {
    const fakeToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.tampered_signature";
    const result = await verifyAuthToken(fakeToken);
    expect(result).toBeNull();
  });
});
