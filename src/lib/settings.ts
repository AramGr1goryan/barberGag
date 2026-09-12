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
