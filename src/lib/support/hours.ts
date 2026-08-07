/** Support hours in the store's home timezone (Houston, TX). */

export const SUPPORT_TIME_ZONE = "America/Chicago";

export type SupportDayKey =
  | "sun"
  | "mon"
  | "tue"
  | "wed"
  | "thu"
  | "fri"
  | "sat";

export type SupportDayHours = {
  enabled: boolean;
  /** Inclusive open hour (0–23). */
  openHour: number;
  /** Exclusive close hour (1–24). */
  closeHour: number;
};

export type SupportSchedule = Record<SupportDayKey, SupportDayHours>;

export const SUPPORT_DAY_ORDER: SupportDayKey[] = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
];

export const SUPPORT_DAY_LABELS: Record<SupportDayKey, string> = {
  sun: "Sunday",
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
};

export const SUPPORT_DAY_SHORT: Record<SupportDayKey, string> = {
  sun: "Sun",
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
};

const WEEKDAY_TO_KEY: Record<string, SupportDayKey> = {
  Sun: "sun",
  Mon: "mon",
  Tue: "tue",
  Wed: "wed",
  Thu: "thu",
  Fri: "fri",
  Sat: "sat",
};

export const DEFAULT_SUPPORT_SCHEDULE: SupportSchedule = {
  sun: { enabled: false, openHour: 9, closeHour: 17 },
  mon: { enabled: true, openHour: 7, closeHour: 18 },
  tue: { enabled: true, openHour: 7, closeHour: 18 },
  wed: { enabled: true, openHour: 7, closeHour: 18 },
  thu: { enabled: true, openHour: 7, closeHour: 18 },
  fri: { enabled: true, openHour: 7, closeHour: 18 },
  sat: { enabled: true, openHour: 8, closeHour: 14 },
};

export function clampHour(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.floor(value)));
}

export function normalizeSupportDayHours(
  value: Partial<SupportDayHours> | null | undefined,
  fallback: SupportDayHours,
): SupportDayHours {
  const openHour = clampHour(
    Number(value?.openHour ?? fallback.openHour),
    0,
    23,
  );
  let closeHour = clampHour(
    Number(value?.closeHour ?? fallback.closeHour),
    1,
    24,
  );
  if (closeHour <= openHour) closeHour = Math.min(24, openHour + 1);
  return {
    enabled:
      typeof value?.enabled === "boolean" ? value.enabled : fallback.enabled,
    openHour,
    closeHour,
  };
}

export function normalizeSupportSchedule(
  value: Partial<Record<SupportDayKey, Partial<SupportDayHours>>> | null | undefined,
): SupportSchedule {
  const next = { ...DEFAULT_SUPPORT_SCHEDULE };
  for (const day of SUPPORT_DAY_ORDER) {
    next[day] = normalizeSupportDayHours(value?.[day], DEFAULT_SUPPORT_SCHEDULE[day]);
  }
  return next;
}

export function formatHourLabel(hour: number) {
  const h = ((hour % 24) + 24) % 24;
  const suffix = h < 12 ? "am" : "pm";
  const twelve = h % 12 === 0 ? 12 : h % 12;
  return `${twelve}${suffix}`;
}

/** Build the compact chat-header hours string from a weekly schedule. */
export function formatSupportHoursLabel(schedule: SupportSchedule): string {
  const enabledDays = SUPPORT_DAY_ORDER.filter((day) => schedule[day].enabled);
  if (enabledDays.length === 0) return "Closed";

  type Block = {
    days: SupportDayKey[];
    openHour: number;
    closeHour: number;
  };

  const blocks: Block[] = [];
  for (const day of enabledDays) {
    const { openHour, closeHour } = schedule[day];
    const last = blocks[blocks.length - 1];
    const prevIndex = last
      ? SUPPORT_DAY_ORDER.indexOf(last.days[last.days.length - 1])
      : -1;
    const dayIndex = SUPPORT_DAY_ORDER.indexOf(day);
    const contiguous =
      last &&
      last.openHour === openHour &&
      last.closeHour === closeHour &&
      dayIndex === prevIndex + 1;

    if (contiguous && last) {
      last.days.push(day);
    } else {
      blocks.push({ days: [day], openHour, closeHour });
    }
  }

  return (
    blocks
      .map((block) => {
        const start = SUPPORT_DAY_SHORT[block.days[0]];
        const end = SUPPORT_DAY_SHORT[block.days[block.days.length - 1]];
        const dayPart = block.days.length > 1 ? `${start}–${end}` : start;
        return `${dayPart} ${formatHourLabel(block.openHour)}–${formatHourLabel(block.closeHour)} CT`;
      })
      .join(" · ") || "Closed"
  );
}

/** @deprecated Prefer formatSupportHoursLabel(schedule). */
export const SUPPORT_HOURS_LABEL = formatSupportHoursLabel(
  DEFAULT_SUPPORT_SCHEDULE,
);

export const SUPPORT_HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => ({
  value: String(hour),
  label: formatHourLabel(hour),
}));

export const SUPPORT_CLOSE_HOUR_OPTIONS = Array.from(
  { length: 24 },
  (_, index) => {
    const hour = index + 1;
    return {
      value: String(hour),
      label: hour === 24 ? "12am (next day)" : formatHourLabel(hour),
    };
  },
);

export function isSupportOpen(
  now: Date = new Date(),
  schedule: SupportSchedule = DEFAULT_SUPPORT_SCHEDULE,
): boolean {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SUPPORT_TIME_ZONE,
    weekday: "short",
    hour: "numeric",
    hour12: false,
  }).formatToParts(now);

  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? NaN);
  const day = WEEKDAY_TO_KEY[weekday];
  if (!day || Number.isNaN(hour)) return false;

  const window = schedule[day];
  if (!window?.enabled) return false;
  return hour >= window.openHour && hour < window.closeHour;
}
