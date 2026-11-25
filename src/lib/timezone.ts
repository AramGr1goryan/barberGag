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
 * Returns current time string in HH:mm (24-hour) formatted for Asia/Yerevan.
 */
export function getCurrentYerevanTimeString(): string {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: BUSINESS_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const formatted = formatter.format(new Date());
  // Guard against environments that format midnight as "24:xx"
  return formatted.startsWith("24:") ? `00:${formatted.slice(3)}` : formatted;
}

/**
 * Determines whether a CONFIRMED booking is still active (its end time is in the future
 * relative to Asia/Yerevan current date & time).
 */
export function isBookingStillActive(
  bookingDate: string,
  bookingEndTime: string,
  referenceDateStr: string = getCurrentYerevanDateString(),
  referenceTimeStr: string = getCurrentYerevanTimeString()
): boolean {
  if (!bookingDate) return false;
  if (bookingDate < referenceDateStr) return false;
  if (bookingDate > referenceDateStr) return true;
  if (!bookingEndTime) return true;
  return parseDateTimeToMinutes(bookingDate, bookingEndTime) > parseDateTimeToMinutes(referenceDateStr, referenceTimeStr);
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
