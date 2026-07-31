/** Support hours in the store's home timezone (Houston, TX). */

const SUPPORT_TIME_ZONE = "America/Chicago";

/** Day index (0 = Sunday) → inclusive open hour, exclusive close hour. */
const SCHEDULE: Record<number, [number, number] | undefined> = {
  1: [7, 18],
  2: [7, 18],
  3: [7, 18],
  4: [7, 18],
  5: [7, 18],
  6: [8, 14],
};

export const SUPPORT_HOURS_LABEL = "Mon–Fri 7am–6pm CT · Sat 8am–2pm CT";

const DAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export function isSupportOpen(now: Date = new Date()): boolean {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SUPPORT_TIME_ZONE,
    weekday: "short",
    hour: "numeric",
    hour12: false,
  }).formatToParts(now);

  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? NaN);
  const window = SCHEDULE[DAY_INDEX[weekday] ?? -1];

  if (!window || Number.isNaN(hour)) return false;
  return hour >= window[0] && hour < window[1];
}
