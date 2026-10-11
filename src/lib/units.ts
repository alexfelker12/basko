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

/** Gültige Mengen: > 0, höchstens 2 Nachkommastellen (Spezifikation → Listeneintrag). */
export function roundQuantity(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Minus ist ausgegraut, wenn Menge ≤ Schrittweite. */
export function canDecrease(quantity: number, unit: Unit): boolean {
  return quantity > getUnitRule(unit).step;
}

export function increaseQuantity(quantity: number, unit: Unit): number {
  return roundQuantity(quantity + getUnitRule(unit).step);
}

export function decreaseQuantity(quantity: number, unit: Unit): number {
  return canDecrease(quantity, unit) ? roundQuantity(quantity - getUnitRule(unit).step) : quantity;
}

/**
 * Einheit wechseln: kg ↔ g und l ↔ ml werden umgerechnet (500 g → 0,5 kg),
 * jeder andere Wechsel setzt den Standardwert der neuen Einheit.
 */
export function convertQuantity(quantity: number, from: Unit, to: Unit): number {
  if (from === to) return quantity;
  const factor =
    (from === "g" && to === "kg") || (from === "ml" && to === "l")
      ? 1 / 1000
      : (from === "kg" && to === "g") || (from === "l" && to === "ml")
        ? 1000
        : null;
  if (factor === null) return getUnitRule(to).defaultValue;
  const converted = roundQuantity(quantity * factor);
  return converted > 0 ? converted : getUnitRule(to).defaultValue;
}

/**
 * Zahleneingabe: Komma und Punkt werden akzeptiert. Liefert `null` bei 0, leer oder ungültig –
 * dann stellt der Aufrufer den alten Wert wieder her.
 */
export function parseQuantityInput(input: string): number | null {
  const normalized = input.trim().replace(",", ".");
  if (!/^\d*\.?\d*$/.test(normalized) || normalized === "" || normalized === ".") return null;
  const value = roundQuantity(Number(normalized));
  return Number.isFinite(value) && value > 0 ? value : null;
}

/** Nachkommastellen für die Anzeige: bei Schrittweite < 1 mindestens eine („1,0“), max. zwei. */
export function quantityFractionDigits(unit: Unit) {
  return { min: getUnitRule(unit).step < 1 ? 1 : 0, max: 2 };
}
