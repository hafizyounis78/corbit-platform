"use client";

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";
import type { Locale } from "@/types/common";
import translations, { type TranslationKey } from "./translations";
import arJson from "./ar.json";
import enJson from "./en.json";

/** Nested JSON dictionary type */
type JsonDict = { [key: string]: string | string[] | JsonDict };

const jsonTranslations: Record<Locale, JsonDict> = {
  ar: arJson as JsonDict,
  en: enJson as JsonDict,
};

/**
 * Resolve a dot-notation key (e.g. "common.save") against a nested JSON object.
 * Returns the string value or undefined if not found.
 */
function resolveJsonKey(dict: JsonDict, dotKey: string): string | undefined {
  const parts = dotKey.split(".");
  let current: unknown = dict;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : undefined;
}

interface LocaleContextValue {
  lang: Locale;
  isAr: boolean;
  rtl: boolean;
  setLang: (lang: Locale) => void;
  toggleLang: () => void;
  /**
   * Translate a key. Accepts either:
   * - A flat key from the legacy translations file (e.g. "save", "dashboard")
   * - A dot-notation key from the JSON files (e.g. "common.save", "dashboard.welcome")
   */
  t: (key: string) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Locale>("ar");
  const isAr = lang === "ar";
  const rtl = isAr;

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === "ar" ? "en" : "ar"));
  }, []);

  const t = useCallback(
    (key: string): string => {
      // 1. If key contains a dot, try the JSON files first (dot-notation)
      if (key.includes(".")) {
        const jsonResult = resolveJsonKey(jsonTranslations[lang], key);
        if (jsonResult !== undefined) return jsonResult;
      }

      // 2. Try the legacy flat translations object
      const entry = translations[key as TranslationKey];
      if (entry) return entry[lang];

      // 3. Fallback: try JSON files with the key as-is (single segment)
      const jsonFallback = resolveJsonKey(jsonTranslations[lang], key);
      if (jsonFallback !== undefined) return jsonFallback;

      // 4. Return the key itself as final fallback
      return key;
    },
    [lang]
  );

  const value = useMemo(
    () => ({ lang, isAr, rtl, setLang, toggleLang, t }),
    [lang, isAr, rtl, toggleLang, t]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
