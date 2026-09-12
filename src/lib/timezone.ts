/**
 * Business timezone helper: strictly calculates time with respect to Armenia (Asia/Yerevan).
 */
export const BUSINESS_TIMEZONE = process.env.BUSINESS_TIMEZONE || "Asia/Yerevan";

/**
 * Returns current date string in YYYY-MM-DD formatted for Asia/Yerevan.
 */
export function getCurrentYerevanDateString(): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
}

/**
 * Parses "YYYY-MM-DD" and "HH:mm" into minutes since epoch or comparable integer minutes.
 */
export function parseDateTimeToMinutes(dateStr: string, timeStr: string): number {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);
  
  // Create UTC date representation for stable arithmetic
  const d = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));
  return Math.floor(d.getTime() / (1000 * 60));
}

/**
 * Checks if target appointment start time is within 3 hours (180 minutes) of existing appointment.
 * 3-hour rule: |targetMinutes - existingMinutes| < 180
 */
export function isWithinThreeHours(
  targetDate: string,
  targetTime: string,
  existingDate: string,
  existingTime: string
): boolean {
  const targetMin = parseDateTimeToMinutes(targetDate, targetTime);
  const existingMin = parseDateTimeToMinutes(existingDate, existingTime);
  const diffMinutes = Math.abs(targetMin - existingMin);
  return diffMinutes < 180;
}

/**
 * Formats AMD currency (e.g. 7000 -> "7,000 ֏" or "7,000 AMD")
 */
export function formatCurrency(amount: number, locale: string = "hy"): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    amount = 0;
  }
  const parts = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  if (locale === "hy" || locale === "ru") {
    return `${parts} ֏`;
  }
  return `${parts} AMD`;
}
