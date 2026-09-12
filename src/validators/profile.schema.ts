import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  preferredHaircut: z.string().max(100).optional(),
  hairColor: z.string().max(50).optional(),
  preferences: z.string().max(500).optional(),
  photoUrl: z.string().optional(),
});
