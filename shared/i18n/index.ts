import { de } from "./de";
import { en } from "./en";
import { es, type Dictionary } from "./es";
import { fr } from "./fr";

export type { Dictionary };

export const LOCALES = ["es", "en", "fr", "de"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "es";

export const DICTIONARIES: Record<Locale, Dictionary> = { es, en, fr, de };

export const LOCALE_LABELS: Record<Locale, { name: string; short: string }> = {
  es: { name: "Español", short: "ES" },
  en: { name: "English", short: "EN" },
  fr: { name: "Français", short: "FR" },
  de: { name: "Deutsch", short: "DE" },
};

export const LOCALE_TAGS: Record<Locale, string> = {
  es: "es-ES",
  en: "en-GB",
  fr: "fr-FR",
  de: "de-DE",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? es;
}

export function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`));
}

type LocalizedService = {
  nameEs: string;
  nameEn?: string | null;
  nameFr?: string | null;
  nameDe?: string | null;
  descriptionEs?: string | null;
  descriptionEn?: string | null;
  descriptionFr?: string | null;
  descriptionDe?: string | null;
};

const NAME_KEY = { es: "nameEs", en: "nameEn", fr: "nameFr", de: "nameDe" } as const;
const DESCRIPTION_KEY = {
  es: "descriptionEs",
  en: "descriptionEn",
  fr: "descriptionFr",
  de: "descriptionDe",
} as const;

export function serviceName(service: LocalizedService, locale: Locale): string {
  return service[NAME_KEY[locale]]?.trim() || service.nameEs;
}

export function serviceDescription(service: LocalizedService, locale: Locale): string {
  return service[DESCRIPTION_KEY[locale]]?.trim() || service.descriptionEs || "";
}

export function mediaAlt(
  item: { alt?: string | null; category: string },
  dictionary: Dictionary,
): string {
  if (item.alt?.trim()) return item.alt;
  const key = item.category as keyof Dictionary["gallery"]["alts"];
  return dictionary.gallery.alts[key] ?? dictionary.gallery.alts.general;
}
