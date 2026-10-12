import { getLocales } from "expo-localization";

import de from "./locales/de";

/**
 * Schlanke i18n-Schicht (Spezifikation → Grundlagen → Sprache).
 * Vorerst nur Deutsch; die Gerätesprache wird über expo-localization gelesen,
 * unbekannte Sprachen fallen auf Deutsch zurück. Rezeptinhalte laufen nicht hierüber.
 */

type PluralForms = { one: string; other: string };

/** Struktur eines Wörterbuchs: verschachtelte Objekte mit Texten oder Pluralformen. */
type DictionaryShape<T> = {
  [K in keyof T]: T[K] extends string
    ? string
    : T[K] extends PluralForms
      ? PluralForms
      : DictionaryShape<T[K]>;
};
export type Dictionary = DictionaryShape<typeof de>;

const dictionaries = { de } satisfies Record<string, Dictionary>;
export type Locale = keyof typeof dictionaries;

const FALLBACK_LOCALE: Locale = "de";

/** Pluralregel je Sprache. */
const pluralRules: Record<Locale, (count: number) => keyof PluralForms> = {
  de: (count) => (count === 1 ? "one" : "other"),
};

function resolveLocale(): Locale {
  for (const { languageCode } of getLocales()) {
    if (languageCode && languageCode in dictionaries) {
      return languageCode as Locale;
    }
  }
  return FALLBACK_LOCALE;
}

/** Aktive Sprache, einmal beim Start bestimmt. */
export const locale: Locale = resolveLocale();

/** BCP-47-Tag für Intl (Zahlen, Sortierung). */
const intlLocale: Record<Locale, string> = { de: "de-DE" };

const numberFormats = new Map<string, Intl.NumberFormat>();

/** Zahl im Format der aktiven Sprache, z. B. „1,0“ oder „0,75“. */
export function formatNumber(
  value: number,
  { min = 0, max = 2 }: { min?: number; max?: number } = {}
): string {
  const key = `${min}-${max}`;
  let format = numberFormats.get(key);
  if (!format) {
    format = new Intl.NumberFormat(intlLocale[locale], {
      minimumFractionDigits: min,
      maximumFractionDigits: max,
      useGrouping: false,
    });
    numberFormats.set(key, format);
  }
  return format.format(value);
}

const dateFormat = new Intl.DateTimeFormat(intlLocale[locale], {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/** Datum im Format der aktiven Sprache, z. B. „28.09.2026“ (Sicherung, 8e). */
export function formatDate(value: Date | number): string {
  return dateFormat.format(value);
}

/** Alphabetische Sortierung der aktiven Sprache, ohne Beachtung der Groß-/Kleinschreibung. */
export const collator = new Intl.Collator(intlLocale[locale], { sensitivity: "base", numeric: true });

/** Alle gültigen Schlüssel als Punkt-Pfade, z. B. "tabs.lists". */
type Paths<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string | PluralForms
    ? `${Prefix}${K}`
    : Paths<T[K], `${Prefix}${K}.`>;
}[keyof T & string];
export type TranslationKey = Paths<typeof de>;

export type TranslationParams = Record<string, string | number>;

function lookup(dictionary: Dictionary, key: string): string | PluralForms | undefined {
  let node: unknown = dictionary;
  for (const part of key.split(".")) {
    if (node === null || typeof node !== "object") return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  if (typeof node === "string") return node;
  if (node && typeof node === "object" && "one" in node && "other" in node) {
    return node as PluralForms;
  }
  return undefined;
}

function interpolate(text: string, params?: TranslationParams) {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match
  );
}

/**
 * Übersetzt einen Schlüssel. Pluralformen wählen über `params.count`.
 * Fehlt ein Text in der aktiven Sprache, wird Deutsch genommen, sonst der Schlüssel selbst.
 */
export function t(key: TranslationKey, params?: TranslationParams): string {
  const entry =
    lookup(dictionaries[locale], key) ?? lookup(dictionaries[FALLBACK_LOCALE], key);

  if (entry === undefined) {
    if (__DEV__) console.warn(`[i18n] Fehlender Text: ${key}`);
    return key;
  }

  if (typeof entry === "string") return interpolate(entry, params);

  const count = Number(params?.count ?? 0);
  return interpolate(entry[pluralRules[locale](count)], params);
}
