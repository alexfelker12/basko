import { getLocales } from "expo-localization";

import de from "./locales/de";
import en from "./locales/en";

/**
 * Schlanke i18n-Schicht (Spezifikation → Grundlagen → Sprache): Deutsch und Englisch.
 * Die Sprache kommt aus der Einstellung `language` (8a): „System“ folgt der Gerätesprache
 * (expo-localization), unbekannte Gerätesprachen bekommen Englisch. Rezeptinhalte laufen nicht
 * hierüber. Gewechselt wird zur Laufzeit über `setLocale` – das Root-Layout hängt danach alle
 * Screens neu ein, damit jeder Text neu übersetzt wird.
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

const dictionaries = { de, en } satisfies Record<string, Dictionary>;
export type Locale = keyof typeof dictionaries;

/** Einstellung „Sprache“ (8a). */
export const LANGUAGE_SETTINGS = ["system", "de", "en"] as const;
export type LanguageSetting = (typeof LANGUAGE_SETTINGS)[number];

/** Gerätesprache weder Deutsch noch Englisch → Englisch. */
const DEVICE_FALLBACK_LOCALE: Locale = "en";
/** Fehlt ein Text (sollte der Typ-Check verhindern), gilt Deutsch. */
const TEXT_FALLBACK_LOCALE: Locale = "de";

/** Pluralregel je Sprache. */
const pluralRules: Record<Locale, (count: number) => keyof PluralForms> = {
  de: (count) => (count === 1 ? "one" : "other"),
  en: (count) => (count === 1 ? "one" : "other"),
};

/** BCP-47-Tag für Intl (Zahlen, Datum, Sortierung); Englisch britisch: 28/09/2026, 1.5. */
const intlLocale: Record<Locale, string> = { de: "de-DE", en: "en-GB" };

/** Sprache zur Einstellung; „system“ nimmt die erste unterstützte Gerätesprache. */
export function resolveLocale(setting: LanguageSetting): Locale {
  if (setting !== "system") return setting;
  for (const { languageCode } of getLocales()) {
    if (languageCode && languageCode in dictionaries) return languageCode as Locale;
  }
  return DEVICE_FALLBACK_LOCALE;
}

let locale: Locale = resolveLocale("system");

/** Aktive Sprache. */
export function getLocale(): Locale {
  return locale;
}

const numberFormats = new Map<string, Intl.NumberFormat>();
let dateFormat = createDateFormat();
let textCollator = createCollator();

function createDateFormat() {
  return new Intl.DateTimeFormat(intlLocale[locale], {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function createCollator() {
  return new Intl.Collator(intlLocale[locale], { sensitivity: "base", numeric: true });
}

/**
 * Stellt die Sprache um (beim Start und bei einer Änderung in 8a) und baut die Formate neu.
 * Ohne Änderung passiert nichts – darf daher auch beim Rendern aufgerufen werden.
 */
export function setLocale(next: Locale) {
  if (next === locale) return;
  locale = next;
  numberFormats.clear();
  dateFormat = createDateFormat();
  textCollator = createCollator();
}

/** Zahl im Format der aktiven Sprache, z. B. „1,0“ bzw. „1.0“. */
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

/** Datum im Format der aktiven Sprache, z. B. „28.09.2026“ bzw. „28/09/2026“ (Sicherung, 8e). */
export function formatDate(value: Date | number): string {
  return dateFormat.format(value);
}

/** Alphabetische Sortierung der aktiven Sprache, ohne Beachtung der Groß-/Kleinschreibung. */
export const collator: Pick<Intl.Collator, "compare"> = {
  compare: (a, b) => textCollator.compare(a, b),
};

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

/** Wie `t`, aber in einer bestimmten Sprache – z. B. Standard-Kategorien beim Sprachwechsel. */
export function translate(target: Locale, key: TranslationKey, params?: TranslationParams): string {
  const entry =
    lookup(dictionaries[target], key) ?? lookup(dictionaries[TEXT_FALLBACK_LOCALE], key);

  if (entry === undefined) {
    if (__DEV__) console.warn(`[i18n] Fehlender Text: ${key}`);
    return key;
  }

  if (typeof entry === "string") return interpolate(entry, params);

  const count = Number(params?.count ?? 0);
  return interpolate(entry[pluralRules[target](count)], params);
}

/** Übersetzt einen Schlüssel in der aktiven Sprache. Pluralformen wählen über `params.count`. */
export function t(key: TranslationKey, params?: TranslationParams): string {
  return translate(locale, key, params);
}

/** Alle Sprachen – z. B. um Standard-Kategorien in jeder Sprache wiederzuerkennen. */
export const LOCALES = Object.keys(dictionaries) as Locale[];
