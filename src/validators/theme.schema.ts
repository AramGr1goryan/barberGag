import { z } from "zod";

const hexColorRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export const updateThemeSchema = z.object({
  background: z.string().regex(hexColorRegex, "Invalid hex color for background"),
  foreground: z.string().regex(hexColorRegex, "Invalid hex color for foreground"),
  surface: z.string().regex(hexColorRegex, "Invalid hex color for surface"),
  surfaceElevated: z.string().regex(hexColorRegex, "Invalid hex color for elevated surface"),
  border: z.string().regex(hexColorRegex, "Invalid hex color for border"),
  muted: z.string().regex(hexColorRegex, "Invalid hex color for muted color"),
  accent: z.string().regex(hexColorRegex, "Invalid hex color for accent"),
  accentForeground: z.string().regex(hexColorRegex, "Invalid hex color for accent foreground"),
  buttonStyle: z.enum(["sharp", "subtle", "pill"]),
  hoverEffect: z.enum(["glow", "lift", "shimmer"]),
});
