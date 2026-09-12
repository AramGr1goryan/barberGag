import { z } from "zod";

/**
 * Normalizes Armenian and international phone numbers into standard format: +374XXXXXXXX
 */
export function normalizePhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("0") && cleaned.length === 9) {
    return `+374${cleaned.substring(1)}`;
  }
  if (cleaned.startsWith("374") && !cleaned.startsWith("+374")) {
    return `+${cleaned}`;
  }
  return cleaned;
}

export const createBookingSchema = z.object({
  serviceId: z.string().min(1, "Service is required"),
  addonIds: z.array(z.string()).default([]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  slotId: z.string().min(1, "Slot selection is required"),
  guestName: z.string().min(2, "Name must have at least 2 characters").max(60),
  guestPhone: z
    .string()
    .min(8, "Phone number is too short")
    .max(20)
    .transform((val) => normalizePhoneNumber(val)),
});

export const verifySmsSchema = z.object({
  bookingId: z.string().min(1),
  code: z.string().length(6, "Verification code must be 6 digits").regex(/^\d+$/, "Code must contain numbers only"),
});

export const rescheduleBookingSchema = z.object({
  bookingId: z.string().min(1),
  newSlotId: z.string().min(1),
  newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
