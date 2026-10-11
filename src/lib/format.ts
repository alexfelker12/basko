import { formatNumber, t } from "@/lib/i18n";
import { quantityFractionDigits, type Unit } from "@/lib/units";

/** Anzeigename einer Einheit, z. B. „Stk“, „Packung“. */
export function unitLabel(unit: Unit): string {
  return t(`units.${unit}`);
}

/** Menge im Mengenregler: bei kg/l immer mit Nachkommastelle („1,0“), sonst ohne („6“). */
export function formatQuantity(quantity: number, unit: Unit): string {
  return formatNumber(quantity, quantityFractionDigits(unit));
}

/**
 * Mengen-Chip im Einkaufsmodus, z. B. „6 Stk“, „1 kg“, „0,5 l“. Mit geschütztem Leerzeichen:
 * Zahl und Einheit dürfen nie auf zwei Zeilen landen.
 */
export function formatQuantityWithUnit(quantity: number, unit: Unit): string {
  return `${formatNumber(quantity)}\u00A0${unitLabel(unit)}`;
}
