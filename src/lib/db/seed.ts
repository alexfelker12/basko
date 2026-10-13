import { count, eq } from "drizzle-orm";

import { LOCALES, t, translate, type Locale } from "@/lib/i18n";
import { normalizeName } from "@/lib/names";

import type { Database } from ".";
import { newId } from "./id";
import { category } from "./schema";

/** Standard-Kategorien beim ersten Start, in dieser Ladenreihenfolge (Spezifikation → Kategorien). */
const DEFAULT_CATEGORY_KEYS = [
  "produce",
  "bakery",
  "chilled",
  "meatFish",
  "frozen",
  "drinks",
  "drugstore",
  "household",
] as const;

/**
 * Legt beim ersten Start die Standard-Kategorien an und stellt sicher,
 * dass die Systemkategorie „Sonstiges“ immer existiert. Synchron und idempotent.
 */
export function seedDatabase(db: Database) {
  db.transaction((tx) => {
    const [{ value: categoryCount }] = tx.select({ value: count() }).from(category).all();

    if (categoryCount === 0) {
      tx.insert(category)
        .values(
          DEFAULT_CATEGORY_KEYS.map((key, index) => ({
            id: newId(),
            name: t(`seed.categories.${key}`),
            sortOrder: index,
            isSystem: false,
          }))
        )
        .run();
    }

    const system = tx
      .select({ id: category.id })
      .from(category)
      .where(eq(category.isSystem, true))
      .get();

    if (!system) {
      // sortOrder ist für „Sonstiges“ ohne Bedeutung – sie steht über `isSystem` immer am Ende.
      tx.insert(category)
        .values({
          id: newId(),
          name: t("seed.categories.other"),
          sortOrder: Number.MAX_SAFE_INTEGER,
          isSystem: true,
        })
        .run();
    }
  });
}

type DefaultCategoryKey = (typeof DEFAULT_CATEGORY_KEYS)[number] | "other";

/** Schlüssel einer Standard-Kategorie, wenn `name` ihr Standardname in irgendeiner Sprache ist. */
function defaultCategoryKey(name: string): DefaultCategoryKey | null {
  for (const key of DEFAULT_CATEGORY_KEYS) {
    if (LOCALES.some((other) => translate(other, `seed.categories.${key}`) === name)) return key;
  }
  return null;
}

/**
 * Sprachwechsel (8a) bzw. Start in einer anderen Sprache: „Sonstiges“ und die Standard-Kategorien,
 * die noch ihren Standardnamen tragen (in irgendeiner Sprache, also nicht umbenannt), bekommen den
 * Namen der Zielsprache – sofern er nicht schon vergeben ist. Umbenannte und eigene Kategorien
 * bleiben. Gibt `true` zurück, wenn sich etwas geändert hat.
 */
export function localizeDefaultCategories(db: Database, target: Locale): boolean {
  const rows = db
    .select({ id: category.id, name: category.name, isSystem: category.isSystem })
    .from(category)
    .all();
  const taken = new Set(rows.map((row) => normalizeName(row.name)));
  let changed = false;

  db.transaction((tx) => {
    for (const row of rows) {
      const key = row.isSystem ? "other" : defaultCategoryKey(row.name);
      if (!key) continue;
      const name = translate(target, `seed.categories.${key}`);
      if (name === row.name) continue;
      // Gleicher Name bis auf Groß-/Kleinschreibung zählt nicht als vergeben (z. B. nur Schreibweise)
      const normalized = normalizeName(name);
      if (normalized !== normalizeName(row.name) && taken.has(normalized)) continue;

      tx.update(category).set({ name }).where(eq(category.id, row.id)).run();
      taken.delete(normalizeName(row.name));
      taken.add(normalized);
      changed = true;
    }
  });

  return changed;
}
