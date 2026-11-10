import { prisma } from "@/lib/prisma";

export async function getCancellationCooldownHours(): Promise<number> {
  try {
    const setting = await prisma.siteContent.findUnique({
      where: { key: "cancellation_cooldown_hours" },
    });
    if (setting && setting.valueEn !== undefined && setting.valueEn !== null && setting.valueEn.trim() !== "") {
      const parsed = parseFloat(setting.valueEn);
      if (!isNaN(parsed) && parsed >= 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Error reading cancellation_cooldown_hours:", err);
  }
  return 3;
}

export async function setCancellationCooldownHours(hours: number): Promise<number> {
  const safeHours = Math.max(0, Math.min(168, Number(hours) || 0));
  await prisma.siteContent.upsert({
    where: { key: "cancellation_cooldown_hours" },
    update: {
      valueHy: String(safeHours),
      valueRu: String(safeHours),
      valueEn: String(safeHours),
      section: "booking_rules",
    },
    create: {
      key: "cancellation_cooldown_hours",
      valueHy: String(safeHours),
      valueRu: String(safeHours),
      valueEn: String(safeHours),
      section: "booking_rules",
    },
  });
  return safeHours;
}

export const DEFAULT_BREAK_START_TIME = "12:00";

export async function getBreakStartTime(): Promise<string> {
  try {
    const setting = await prisma.siteContent.findUnique({
      where: { key: "barber_break_start_time" },
    });
    if (
      setting &&
      setting.valueEn &&
      /^([01]\d|2[0-3]):[0-5]\d$/.test(setting.valueEn.trim())
    ) {
      return setting.valueEn.trim();
    }
  } catch (err) {
    console.error("Error reading barber_break_start_time:", err);
  }
  return DEFAULT_BREAK_START_TIME;
}

export async function setBreakStartTime(startTime: string): Promise<string> {
  const trimmed = (startTime || "").trim();
  const safeTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(trimmed)
    ? trimmed
    : DEFAULT_BREAK_START_TIME;
  await prisma.siteContent.upsert({
    where: { key: "barber_break_start_time" },
    update: {
      valueHy: safeTime,
      valueRu: safeTime,
      valueEn: safeTime,
      section: "booking_rules",
    },
    create: {
      key: "barber_break_start_time",
      valueHy: safeTime,
      valueRu: safeTime,
      valueEn: safeTime,
      section: "booking_rules",
    },
  });
  return safeTime;
}
