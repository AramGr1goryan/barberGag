import { describe, it, expect } from "vitest";
import { normalizePhoneNumber, createBookingSchema } from "../src/validators/booking.schema";
import { updateThemeSchema } from "../src/validators/theme.schema";

describe("Validation Schemas & Normalization", () => {
  it("should normalize Armenian local format 091XXXXXX to +37491XXXXXX", () => {
    expect(normalizePhoneNumber("091123456")).toBe("+37491123456");
  });

  it("should normalize Armenian without plus 37491XXXXXX to +37491XXXXXX", () => {
    expect(normalizePhoneNumber("37491123456")).toBe("+37491123456");
  });

  it("should preserve already normalized international format", () => {
    expect(normalizePhoneNumber("+37491123456")).toBe("+37491123456");
    expect(normalizePhoneNumber("+14155552671")).toBe("+14155552671");
  });

  it("should strip spaces, dashes, and parentheses", () => {
    expect(normalizePhoneNumber("+374 (91) 12-34-56")).toBe("+37491123456");
  });

  it("should validate booking schema with proper fields", () => {
    const validBooking = {
      serviceId: "srv-123",
      addonIds: ["add-1", "add-2"],
      date: "2026-09-20",
      slotId: "slt-456",
      guestName: "Aram Sargsyan",
      guestPhone: "091123456",
    };

    const parsed = createBookingSchema.safeParse(validBooking);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.guestPhone).toBe("+37491123456");
    }
  });

  it("should reject invalid date format in booking schema", () => {
    const invalidBooking = {
      serviceId: "srv-123",
      addonIds: [],
      date: "20-09-2026", // Wrong format
      slotId: "slt-456",
      guestName: "Aram",
      guestPhone: "+37491123456",
    };

    const parsed = createBookingSchema.safeParse(invalidBooking);
    expect(parsed.success).toBe(false);
  });

  it("should validate theme schema with hex colors and reject arbitrary CSS", () => {
    const validTheme = {
      background: "#0d0d0f",
      foreground: "#f4f4f6",
      surface: "#16161a",
      surfaceElevated: "#1f1f24",
      border: "#2a2a32",
      muted: "#8e8e9c",
      accent: "#c5a880",
      accentForeground: "#000000",
      buttonStyle: "sharp" as const,
      hoverEffect: "glow" as const,
    };

    expect(updateThemeSchema.safeParse(validTheme).success).toBe(true);

    const maliciousTheme = {
      ...validTheme,
      accent: "red; body { display: none; }", // CSS injection attempt
    };
    expect(updateThemeSchema.safeParse(maliciousTheme).success).toBe(false);
  });
});
