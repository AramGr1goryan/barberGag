import { z } from "zod";
import { normalizePhoneNumber } from "./booking.schema";

export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  phone: z
    .string()
    .min(8, "Phone number is too short")
    .max(20)
    .transform((val) => normalizePhoneNumber(val)),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100),
});

export const loginSchema = z.object({
  identifier: z.string().min(3, "Please enter your email or phone number"),
  password: z.string().min(1, "Password is required"),
});
