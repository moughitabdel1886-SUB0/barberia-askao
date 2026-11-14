import { LOCALE_TAGS, type Locale } from "@shared/i18n";
import { formatPrice, madridNow, type HoursConfig } from "@shared/booking";

export function hasDefaultHours(hours: HoursConfig): boolean {
  const week = hours.slice(1, 7);
  return week.length === 6 && week.every(day => !day.closed && day.open === "10:00" && day.close === "21:00");
}

export function formatMoney(cents: number, locale: Locale): string {
  return formatPrice(cents, LOCALE_TAGS[locale]);
}

function dateAtNoon(iso: string): Date {
  return new Date(`${iso}T12:00:00Z`);
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatDateLong(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(LOCALE_TAGS[locale], {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(dateAtNoon(iso));
}

export function formatDateShort(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(LOCALE_TAGS[locale], {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(dateAtNoon(iso));
}

export function formatWeekdayShort(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(LOCALE_TAGS[locale], {
    weekday: "short",
    timeZone: "UTC",
  })
    .format(dateAtNoon(iso))
    .replace(".", "");
}

export function formatMonthLabel(month: string, locale: Locale): string {
  return capitalize(
    new Intl.DateTimeFormat(LOCALE_TAGS[locale], {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(dateAtNoon(`${month}-01`)),
  );
}

export function formatSlot(time: string, locale: Locale): string {
  if (locale !== "en") return time;
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date(Date.UTC(2026, 0, 1, hours, minutes));
  return new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  })
    .format(date)
    .toLowerCase()
    .replace(":00", "");
}

export function currentMonth(): string {
  return madridNow().date.slice(0, 7);
}

export function shiftMonth(month: string, delta: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + delta, 1));
  return date.toISOString().slice(0, 7);
}

export function monthBounds(month: string): { from: string; to: string } {
  const [year, monthNumber] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, monthNumber - 1, 1));
  const last = new Date(Date.UTC(year, monthNumber, 0));
  return { from: first.toISOString().slice(0, 10), to: last.toISOString().slice(0, 10) };
}

export type CalendarCell = { iso: string; day: number; inMonth: boolean };

/** Monday-first 6×7 calendar grid for a `YYYY-MM` month. */
export function monthGrid(month: string): CalendarCell[] {
  const [year, monthNumber] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, monthNumber - 1, 1));
  const offset = (first.getUTCDay() + 6) % 7;
  const start = new Date(Date.UTC(year, monthNumber - 1, 1 - offset));
  const cells: CalendarCell[] = [];
  for (let index = 0; index < 42; index += 1) {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    cells.push({
      iso: date.toISOString().slice(0, 10),
      day: date.getUTCDate(),
      inMonth: date.getUTCMonth() === monthNumber - 1,
    });
  }
  return cells;
}

export function whatsappHref(number: string, text: string): string {
  let digits = number.replace(/\D/g, "");
  if (digits.length === 9) digits = `34${digits}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function telHref(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `tel:${digits.startsWith("34") ? "+" : ""}${digits}`;
}

export function mapsEmbedUrl(locale: Locale): string {
  const query = "Barbería Askao, Askao Kalea 27, 48005 Bilbao, Bizkaia";
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed&hl=${locale}&z=17`;
}

export function instagramHref(handle: string): string {
  return `https://instagram.com/${handle.replace(/^@/, "")}`;
}

export function tiktokHref(handle: string): string {
  return `https://tiktok.com/@${handle.replace(/^@/, "")}`;
}

export function scrollToId(id: string) {
  const element = document.getElementById(id);
  if (!element) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  element.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}
