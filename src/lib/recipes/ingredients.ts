import { LIST_ITEM_NOTE_MAX, PRODUCT_NAME_MAX } from "@/lib/db/schema";
import { normalizeName } from "@/lib/names";
import { getUnitRule, roundQuantity, type Unit } from "@/lib/units";

import type { RecipeIngredient } from "./api";

/** Menge und Einheit eines Listeneintrags. */
export type Amount = { quantity: number; unit: Unit };

/** Eine Zutat, wie sie in „Einkaufsliste erstellen“ (7e) steht – doppelte schon zusammengefasst. */
export type RecipeListEntry = {
  key: string;
  /** Produktname: Teil vor „;“ bzw. „,“ („Onion; chopped“, „Onion, chopped“ → „Onion“), max. 100 Zeichen. */
  name: string;
  /** Originalangaben wie geliefert („2 tablespoon“); kommen in die Notiz des Eintrags. */
  originals: string[];
  amount: Amount;
};

type Conversion =
  /** In g/ml umrechnen (Faktor je Einheit) und auf 50 runden. */
  | { kind: "round50"; unit: "g" | "ml"; factor: number }
  /** Metrische Angabe übernehmen. */
  | { kind: "metric"; unit: "g" | "kg" | "ml" | "l"; factor: number }
  /** Löffel: immer 1 Stk. */
  | { kind: "spoon" };

/**
 * Rezept-Einheiten (Spezifikation → 7 · Einheiten umrechnen, ergänzt in Phase 5):
 * lb/oz → g und cup/fl oz → ml (gerundet auf 50), tbsp/tsp → 1 Stk; metrische Angaben und
 * pint/quart/gallon werden sinngemäß umgerechnet. Alles andere (clove, large, whole, can, unit …
 * oder ohne Einheit) wird Stk, aufgerundet, mindestens 1.
 * Schlüssel: kleingeschrieben, ohne Punkte und Plural-„s“.
 */
const CONVERSIONS: Record<string, Conversion> = {
  pound: { kind: "round50", unit: "g", factor: 453.592 },
  lb: { kind: "round50", unit: "g", factor: 453.592 },
  ounce: { kind: "round50", unit: "g", factor: 28.3495 },
  oz: { kind: "round50", unit: "g", factor: 28.3495 },
  cup: { kind: "round50", unit: "ml", factor: 236.588 },
  "fluid ounce": { kind: "round50", unit: "ml", factor: 29.5735 },
  "fl oz": { kind: "round50", unit: "ml", factor: 29.5735 },
  pint: { kind: "round50", unit: "ml", factor: 473.176 },
  pt: { kind: "round50", unit: "ml", factor: 473.176 },
  quart: { kind: "round50", unit: "ml", factor: 946.353 },
  qt: { kind: "round50", unit: "ml", factor: 946.353 },
  gallon: { kind: "round50", unit: "ml", factor: 3785.41 },
  gal: { kind: "round50", unit: "ml", factor: 3785.41 },
  tablespoon: { kind: "spoon" },
  tbsp: { kind: "spoon" },
  tbs: { kind: "spoon" },
  teaspoon: { kind: "spoon" },
  tsp: { kind: "spoon" },
  gram: { kind: "metric", unit: "g", factor: 1 },
  gramme: { kind: "metric", unit: "g", factor: 1 },
  g: { kind: "metric", unit: "g", factor: 1 },
  kilogram: { kind: "metric", unit: "kg", factor: 1 },
  kg: { kind: "metric", unit: "kg", factor: 1 },
  milliliter: { kind: "metric", unit: "ml", factor: 1 },
  millilitre: { kind: "metric", unit: "ml", factor: 1 },
  ml: { kind: "metric", unit: "ml", factor: 1 },
  centiliter: { kind: "metric", unit: "ml", factor: 10 },
  cl: { kind: "metric", unit: "ml", factor: 10 },
  deciliter: { kind: "metric", unit: "ml", factor: 100 },
  dl: { kind: "metric", unit: "ml", factor: 100 },
  liter: { kind: "metric", unit: "l", factor: 1 },
  litre: { kind: "metric", unit: "l", factor: 1 },
  l: { kind: "metric", unit: "l", factor: 1 },
};

function conversionKey(unit: string): string {
  const key = unit.trim().toLocaleLowerCase("en").replace(/\./g, "").replace(/\s+/g, " ");
  if (key in CONVERSIONS) return key;
  // Plural: „cups“, „pounds“, „fluid ounces“, „lbs“
  for (const suffix of ["s", "es"]) {
    const singular = key.endsWith(suffix) ? key.slice(0, -suffix.length) : null;
    if (singular && singular in CONVERSIONS) return singular;
  }
  return key;
}

/** Gültige Menge (> 0, endlich) oder `null`. */
function validQuantity(quantity: number | null): number | null {
  return quantity !== null && Number.isFinite(quantity) && quantity > 0 ? quantity : null;
}

function roundTo50(value: number): number {
  return Math.max(50, Math.round(value / 50) * 50);
}

/** Rezept-Angabe → Menge und Einheit des Listeneintrags. */
export function convertIngredientAmount(quantity: number | null, unit: string | null): Amount {
  const value = validQuantity(quantity);
  const conversion = unit ? CONVERSIONS[conversionKey(unit)] : undefined;

  switch (conversion?.kind) {
    case "round50":
      return { quantity: roundTo50((value ?? 1) * conversion.factor), unit: conversion.unit };
    case "metric": {
      if (value === null) {
        return { quantity: getUnitRule(conversion.unit).defaultValue, unit: conversion.unit };
      }
      const converted = roundQuantity(value * conversion.factor);
      return converted > 0
        ? { quantity: converted, unit: conversion.unit }
        : { quantity: getUnitRule(conversion.unit).defaultValue, unit: conversion.unit };
    }
    case "spoon":
      return { quantity: 1, unit: "pcs" };
    default:
      return { quantity: Math.max(1, Math.ceil(value ?? 1)), unit: "pcs" };
  }
}

/** Zahl in englischer Schreibweise wie in der API („1.5“, „0.25“). */
function formatRecipeNumber(value: number): string {
  return String(Math.round(value * 100) / 100);
}

/**
 * Originalangabe, z. B. „2 tablespoon“, „1.5 pound“, „3“ (Einheit „unit“ = ohne Einheit).
 * Leer, wenn weder Menge noch Einheit da sind.
 */
export function formatOriginalAmount({ quantity, unit }: RecipeIngredient): string {
  const value = validQuantity(quantity);
  const unitText = unit && unit.toLocaleLowerCase("en") !== "unit" ? unit : "";
  return [value === null ? "" : formatRecipeNumber(value), unitText].filter(Boolean).join(" ");
}

/**
 * Produktname aus dem Zutatennamen: Teil vor dem ersten „;“ oder „,“ – dahinter steht die
 * Zubereitung („Garlic cloves; finely grated“, „Chicken thighs, boneless“). Max. 100 Zeichen.
 */
export function ingredientProductName(name: string): string {
  const base = name.split(/[;,]/)[0].trim() || name.trim();
  return base.slice(0, PRODUCT_NAME_MAX).trim();
}

/**
 * Mengen derselben Zutat zusammenrechnen: Angaben in derselben Einheit wie die erste werden
 * addiert (g/kg und ml/l umgerechnet), andere bleiben nur als Originalangabe in der Notiz.
 */
function mergeAmounts(first: Amount, next: Amount): Amount {
  if (next.unit === first.unit) {
    return { quantity: roundQuantity(first.quantity + next.quantity), unit: first.unit };
  }
  const factor =
    (next.unit === "g" && first.unit === "kg") || (next.unit === "ml" && first.unit === "l")
      ? 1 / 1000
      : (next.unit === "kg" && first.unit === "g") || (next.unit === "l" && first.unit === "ml")
        ? 1000
        : null;
  if (factor === null) return first;
  return { quantity: roundQuantity(first.quantity + next.quantity * factor), unit: first.unit };
}

/** Doppelte Zutaten (gleicher Name ohne Groß-/Kleinschreibung) zu einem Eintrag zusammenfassen. */
export function mergeEntries<T extends Omit<RecipeListEntry, "key">>(entries: T[]): T[] {
  const merged = new Map<string, T>();
  for (const entry of entries) {
    const key = normalizeName(entry.name);
    if (!key) continue;
    const existing = merged.get(key);
    merged.set(
      key,
      existing
        ? {
            ...existing,
            originals: [...existing.originals, ...entry.originals],
            amount: mergeAmounts(existing.amount, entry.amount),
          }
        : entry
    );
  }
  return [...merged.values()];
}

/** Zutaten eines Rezepts → Einträge für 7e (bereinigt, umgerechnet, zusammengefasst). */
export function recipeListEntries(ingredients: RecipeIngredient[]): RecipeListEntry[] {
  return mergeEntries(
    ingredients.map((ingredient) => {
      const original = formatOriginalAmount(ingredient);
      return {
        name: ingredientProductName(ingredient.name),
        originals: original ? [original] : [],
        amount: convertIngredientAmount(ingredient.quantity, ingredient.unit),
      };
    })
  ).map((entry, index) => ({ ...entry, key: String(index) }));
}

/** Notiz des Eintrags: die Originalangaben („2 tablespoon + 1 teaspoon“), max. 100 Zeichen. */
export function originalsNote(originals: string[]): string | null {
  const note = originals.join(" + ");
  if (!note) return null;
  return note.length > LIST_ITEM_NOTE_MAX ? `${note.slice(0, LIST_ITEM_NOTE_MAX - 1)}…` : note;
}
