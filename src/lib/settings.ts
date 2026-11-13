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
const TIME_24H_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_YYYY_MM_DD_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export async function getBreakStartTime(): Promise<string> {
  try {
    const setting = await prisma.siteContent.findUnique({
      where: { key: "barber_break_start_time" },
    });
    if (setting?.valueEn && TIME_24H_REGEX.test(setting.valueEn.trim())) {
      return setting.valueEn.trim();
    }
  } catch (err) {
    console.error("Error reading barber_break_start_time:", err);
  }
  return DEFAULT_BREAK_START_TIME;
}

export async function setBreakStartTime(startTime: string): Promise<string> {
  const trimmed = (startTime || "").trim();
  const safeTime = TIME_24H_REGEX.test(trimmed)
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

export async function getBreakDayOverrides(): Promise<Record<string, string>> {
  try {
    const setting = await prisma.siteContent.findUnique({
      where: { key: "barber_break_day_overrides" },
    });
    if (setting?.valueEn) {
      const parsed = JSON.parse(setting.valueEn);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const clean: Record<string, string> = {};
        for (const [dateKey, timeVal] of Object.entries(parsed)) {
          if (
            DATE_YYYY_MM_DD_REGEX.test(dateKey) &&
            typeof timeVal === "string" &&
            TIME_24H_REGEX.test(timeVal.trim())
          ) {
            clean[dateKey] = timeVal.trim();
          }
        }
        return clean;
      }
    }
  } catch (err) {
    console.error("Error reading barber_break_day_overrides:", err);
  }
  return {};
}

export async function saveBreakDayOverrides(
  overrides: Record<string, string>
): Promise<Record<string, string>> {
  const clean: Record<string, string> = {};
  for (const [dateKey, timeVal] of Object.entries(overrides)) {
    if (
      DATE_YYYY_MM_DD_REGEX.test(dateKey) &&
      typeof timeVal === "string" &&
      TIME_24H_REGEX.test(timeVal.trim())
    ) {
      clean[dateKey] = timeVal.trim();
    }
  }
  const serialized = JSON.stringify(clean);
  await prisma.siteContent.upsert({
    where: { key: "barber_break_day_overrides" },
    update: {
      valueHy: serialized,
      valueRu: serialized,
      valueEn: serialized,
      section: "booking_rules",
    },
    create: {
      key: "barber_break_day_overrides",
      valueHy: serialized,
      valueRu: serialized,
      valueEn: serialized,
      section: "booking_rules",
    },
  });
  return clean;
}

export async function getBreakStartTimeForDate(dateStr: string): Promise<{
  breakStartTime: string;
  globalBreakStartTime: string;
  isOverride: boolean;
}> {
  const [globalBreakStartTime, overrides] = await Promise.all([
    getBreakStartTime(),
    getBreakDayOverrides(),
  ]);
  const override = overrides[dateStr];
  if (override && TIME_24H_REGEX.test(override)) {
    return {
      breakStartTime: override,
      globalBreakStartTime,
      isOverride: true,
    };
  }
  return {
    breakStartTime: globalBreakStartTime,
    globalBreakStartTime,
    isOverride: false,
  };
}
