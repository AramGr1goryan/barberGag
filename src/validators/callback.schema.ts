import { z } from "zod";
import { normalizePhoneNumber } from "./booking.schema";

export const callbackSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  phone: z
    .string()
    .min(8, "Phone number is too short")
    .max(20)
    .transform((val) => normalizePhoneNumber(val)),
  preferredTime: z.string().max(50).optional(),
  message: z.string().max(500).optional(),
});
