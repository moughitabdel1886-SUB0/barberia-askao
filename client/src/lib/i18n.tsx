import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  DEFAULT_LOCALE,
  LOCALE_LABELS,
  LOCALE_TAGS,
  getDictionary,
  isLocale,
  type Dictionary,
  type Locale,
} from "@shared/i18n";

const STORAGE_KEY = "askao-locale";

const OG_LOCALES: Record<Locale, string> = {
  es: "es_ES",
  en: "en_GB",
  fr: "fr_FR",
  de: "de_DE",
};

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
  tag: string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function initialLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isLocale(stored)) return stored;
    const param = new URLSearchParams(window.location.search).get("lang");
    if (isLocale(param)) return param;
  } catch {
    // Storage can be unavailable in strict privacy modes.
  }
  return DEFAULT_LOCALE;
}

function setMeta(selector: string, attr: "name" | "property", key: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore storage failures; the session still switches language.
    }
  }, []);

  useEffect(() => {
    const dictionary = getDictionary(locale);
    document.documentElement.lang = locale;
    document.title = dictionary.meta.title;

    setMeta('meta[name="description"]', "name", "description", dictionary.meta.description);
    setMeta('meta[property="og:title"]', "property", "og:title", dictionary.meta.title);
    setMeta('meta[property="og:description"]', "property", "og:description", dictionary.meta.description);
    setMeta('meta[property="og:locale"]', "property", "og:locale", OG_LOCALES[locale]);
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", dictionary.meta.title);
    setMeta('meta[name="twitter:description"]', "name", "twitter:description", dictionary.meta.description);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = `${window.location.origin}${window.location.pathname}`;
    setMeta('meta[property="og:url"]', "property", "og:url", canonical.href);
    const ogImage = `${window.location.origin}/og.jpg`;
    setMeta('meta[property="og:image"]', "property", "og:image", ogImage);
    setMeta('meta[name="twitter:image"]', "name", "twitter:image", ogImage);
  }, [locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      t: getDictionary(locale),
      tag: LOCALE_TAGS[locale],
    }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useI18n(): LocaleContextValue {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("useI18n must be used inside LocaleProvider");
  return value;
}

export { LOCALE_LABELS };
export type { Locale };
