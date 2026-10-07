import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  preferredHaircut: z.string().max(100).nullable().optional(),
  hairColor: z.string().max(50).nullable().optional(),
  preferences: z.string().max(500).nullable().optional(),
  photoUrl: z.string().nullable().optional(),
});
