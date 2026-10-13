import { LOCALES, t, translate } from "@/lib/i18n";

/** Standard-Kategorien beim ersten Start, in dieser Ladenreihenfolge (Spezifikation → Kategorien). */
export const DEFAULT_CATEGORY_KEYS = [
  "produce",
  "bakery",
  "chilled",
  "meatFish",
  "frozen",
  "drinks",
  "drugstore",
  "household",
] as const;

/** Schlüssel der Systemkategorie „Sonstiges“. */
export const SYSTEM_CATEGORY_KEY = "other";

export const CATEGORY_KEYS = [...DEFAULT_CATEGORY_KEYS, SYSTEM_CATEGORY_KEY] as const;
export type CategoryKey = (typeof CATEGORY_KEYS)[number];

export function isCategoryKey(key: unknown): key is CategoryKey {
  return typeof key === "string" && (CATEGORY_KEYS as readonly string[]).includes(key);
}

/**
 * Angezeigter Name einer Kategorie: Standard-Kategorien und „Sonstiges“ tragen einen Schlüssel
 * (`category.key`) und erscheinen in der aktiven Sprache; eigene oder umbenannte Kategorien
 * (Schlüssel `null`) mit ihrem gespeicherten Namen.
 */
export function categoryLabel(key: string | null, name: string): string {
  return isCategoryKey(key) ? t(`seed.categories.${key}`) : name;
}

/**
 * Schlüssel zu einem gespeicherten Namen, wenn er der Standardname in irgendeiner Sprache ist –
 * für Daten ohne Schlüssel (Sicherungen vor Phase 7). „Sonstiges“ erkennt man an `isSystem`.
 */
export function defaultCategoryKeyForName(name: string): CategoryKey | null {
  for (const key of DEFAULT_CATEGORY_KEYS) {
    if (LOCALES.some((locale) => translate(locale, `seed.categories.${key}`) === name)) return key;
  }
  return null;
}
