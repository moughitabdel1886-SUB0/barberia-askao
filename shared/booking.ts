/**
 * Pure booking rules shared by the server and the browser.
 * Dates are ISO `YYYY-MM-DD`; times are `HH:MM` in Europe/Madrid.
 */

export type HoursDay = { closed: boolean; open: string; close: string };
export type HoursConfig = HoursDay[];

export type BookingRules = {
  hours: HoursConfig;
  slotMinutes: number;
  minLeadMinutes: number;
  maxDaysAhead: number;
};

export type MadridNow = { date: string; minutes: number; weekday: number };

export const MADRID_TZ = "Europe/Madrid";

export const DEFAULT_HOURS: HoursConfig = [
  { closed: true, open: "10:00", close: "21:00" }, // Sunday
  { closed: false, open: "10:00", close: "21:00" }, // Monday
  { closed: false, open: "10:00", close: "21:00" },
  { closed: false, open: "10:00", close: "21:00" },
  { closed: false, open: "10:00", close: "21:00" },
  { closed: false, open: "10:00", close: "21:00" },
  { closed: false, open: "10:00", close: "21:00" }, // Saturday
];

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isTime(value: string): boolean {
  return TIME_RE.test(value);
}

export function isISODate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const d = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function timeToMinutes(value: string): number {
  const match = TIME_RE.exec(value);
  if (!match) throw new Error(`Invalid time: ${value}`);
  return Number(match[1]) * 60 + Number(match[2]);
}

export function minutesToTime(total: number): string {
  const normalized = ((total % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Weekday for an ISO date, 0 = Sunday. Uses UTC noon so DST cannot shift the day. */
export function weekdayFromISO(date: string): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

/** Whole calendar days from `from` to `to` (positive when `to` is later). */
export function daysBetweenISO(from: string, to: string): number {
  const a = Date.UTC(Number(from.slice(0, 4)), Number(from.slice(5, 7)) - 1, Number(from.slice(8, 10)));
  const b = Date.UTC(Number(to.slice(0, 4)), Number(to.slice(5, 7)) - 1, Number(to.slice(8, 10)));
  return Math.round((b - a) / 86_400_000);
}

export function addDaysISO(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Current wall-clock date and minute in Madrid, independent of the server timezone. */
export function madridNow(now: Date = new Date()): MadridNow {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: MADRID_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const get = (type: string) => parts.find(part => part.type === type)?.value ?? "00";
  const hour = Number(get("hour")) % 24;
  const date = `${get("year")}-${get("month")}-${get("day")}`;
  return { date, minutes: hour * 60 + Number(get("minute")), weekday: weekdayFromISO(date) };
}

/**
 * Slots a booking would occupy. Includes every slot whose start falls before
 * the service ends, so a 45-minute service blocks the following half hour too.
 */
export function coveredSlots(start: string, durationMin: number, slotMinutes: number): string[] {
  const startMin = timeToMinutes(start);
  const endMin = startMin + durationMin;
  const step = Math.max(5, slotMinutes);
  const slots: string[] = [];
  for (let t = startMin; t < endMin; t += step) slots.push(minutesToTime(t));
  return slots;
}

export type AvailabilityInput = {
  date: string;
  durationMin: number;
  rules: BookingRules;
  /** Times already taken by active bookings on this date. */
  occupied: readonly string[];
  /** Times blocked by the owner on this date; `ALL` blocks the day. */
  blocked: readonly string[];
  /** Injected for deterministic tests. */
  now?: Date;
};

/**
 * Returns only bookable start times. The caller still needs the database
 * transaction/unique index to win races; this function is the planning layer.
 */
export function availableSlots({
  date,
  durationMin,
  rules,
  occupied,
  blocked,
  now = new Date(),
}: AvailabilityInput): string[] {
  if (!isISODate(date)) return [];
  if (!Number.isFinite(durationMin) || durationMin <= 0) return [];
  if (blocked.includes("ALL")) return [];

  const today = madridNow(now);
  const offset = daysBetweenISO(today.date, date);
  if (offset < 0 || offset > rules.maxDaysAhead) return [];

  const day = rules.hours[weekdayFromISO(date)];
  if (!day || day.closed) return [];

  const open = timeToMinutes(day.open);
  const close = timeToMinutes(day.close);
  if (close <= open) return [];

  const step = Math.max(5, rules.slotMinutes);
  const occupiedSet = new Set(occupied);
  const blockedSet = new Set<string>();
  for (const blockedTime of blocked) {
    if (blockedTime === "ALL" || !isTime(blockedTime)) continue;
    const blockStart = timeToMinutes(blockedTime);
    // The owner blocks a one-hour stretch, so a 14:00 block also protects
    // the 14:30 start that a longer service would overlap.
    for (let t = blockStart; t < blockStart + 60; t += step) {
      blockedSet.add(minutesToTime(t));
    }
  }
  const earliestToday = today.minutes + rules.minLeadMinutes;
  const slots: string[] = [];

  for (let start = open; start + durationMin <= close; start += step) {
    if (offset === 0 && start < earliestToday) continue;
    const covered = coveredSlots(minutesToTime(start), durationMin, step);
    if (covered.some(slot => occupiedSet.has(slot) || blockedSet.has(slot))) continue;
    slots.push(minutesToTime(start));
  }

  return slots;
}

export function endTime(start: string, durationMin: number): string {
  return minutesToTime(timeToMinutes(start) + durationMin);
}

export function formatPrice(cents: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}
