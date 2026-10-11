/**
 * Feste Einheiten (Spezifikation → Datenmodell → Einheiten).
 * Gespeichert wird der Code, angezeigt wird der Text aus der i18n-Schicht (`units.<code>`).
 * EL und TL gibt es nicht.
 */
export const UNITS = [
  // Hauptauswahl
  "pcs",
  "kg",
  "g",
  "l",
  "ml",
  // „Weitere Einheiten“ (Schritt 1, Standardwert 1)
  "pack",
  "can",
  "bottle",
  "jar",
  "cup",
  "bunch",
  "bag",
  "net",
  "crate",
  "slice",
  "roll",
  "tube",
] as const;

export type Unit = (typeof UNITS)[number];

export const MAIN_UNITS = ["pcs", "kg", "g", "l", "ml"] as const satisfies readonly Unit[];

export const MORE_UNITS = UNITS.filter(
  (unit) => !(MAIN_UNITS as readonly Unit[]).includes(unit)
) as Exclude<Unit, (typeof MAIN_UNITS)[number]>[];

type UnitRule = { step: number; defaultValue: number };

const RULES: Partial<Record<Unit, UnitRule>> = {
  pcs: { step: 1, defaultValue: 1 },
  kg: { step: 0.1, defaultValue: 1 },
  g: { step: 50, defaultValue: 500 },
  l: { step: 0.1, defaultValue: 1 },
  ml: { step: 50, defaultValue: 500 },
};

const DEFAULT_RULE: UnitRule = { step: 1, defaultValue: 1 };

/** Schrittweite und Standardwert beim Wechsel auf diese Einheit. */
export function getUnitRule(unit: Unit): UnitRule {
  return RULES[unit] ?? DEFAULT_RULE;
}

export const DEFAULT_UNIT: Unit = "pcs";
