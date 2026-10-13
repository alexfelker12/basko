import { asc, count, eq, max } from "drizzle-orm";

import { db } from "@/lib/db";
import { newId } from "@/lib/db/id";
import { CATEGORY_NAME_MAX, category, product } from "@/lib/db/schema";
import { categoryLabel } from "@/lib/category-name";
import { isNameTaken } from "@/lib/names";

export type CategoryRow = {
  id: string;
  name: string;
  isSystem: boolean;
  sortOrder: number;
  /** Anzahl Produkte im Katalog mit dieser Kategorie (5a). */
  productCount: number;
};

/** Alle Kategorien in Ladenreihenfolge, „Sonstiges“ zuletzt (4e, 5a, Filter-Chips). */
export function getCategories(): CategoryRow[] {
  return db
    .select({
      id: category.id,
      name: category.name,
      key: category.key,
      isSystem: category.isSystem,
      sortOrder: category.sortOrder,
      productCount: count(product.id),
    })
    .from(category)
    .leftJoin(product, eq(product.categoryId, category.id))
    .groupBy(category.id)
    .orderBy(asc(category.isSystem), asc(category.sortOrder), asc(category.name))
    .all()
    .map(({ key, ...row }) => ({ ...row, name: categoryLabel(key, row.name) }));
}

/**
 * Vergebene Namen: angezeigte (bei Standard-Kategorien die der aktiven Sprache) und gespeicherte –
 * auch der gespeicherte Name einer Standard-Kategorie ist durch den Unique-Index belegt.
 */
function categoryNames(excludeId?: string): string[] {
  return db
    .select({ id: category.id, name: category.name, key: category.key })
    .from(category)
    .all()
    .filter((row) => row.id !== excludeId)
    .flatMap((row) => [row.name, categoryLabel(row.key, row.name)]);
}

function normalizeCategoryName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > CATEGORY_NAME_MAX) return null;
  return trimmed;
}

/** ID der Systemkategorie „Sonstiges“ (Vorbelegung in 4d, Ziel beim Löschen einer Kategorie). */
export function getSystemCategoryId(): string | null {
  return (
    db.select({ id: category.id }).from(category).where(eq(category.isSystem, true)).get()?.id ??
    null
  );
}

/**
 * Neue Kategorie (5c), am Ende der Ladenreihenfolge vor „Sonstiges“.
 * Liefert `null`, wenn der Name leer, zu lang oder schon vergeben ist.
 */
export function createCategory(name: string): string | null {
  return db.transaction((tx) => {
    const trimmed = normalizeCategoryName(name);
    if (!trimmed || isNameTaken(trimmed, categoryNames())) return null;

    const [{ value: last }] = tx
      .select({ value: max(category.sortOrder) })
      .from(category)
      .where(eq(category.isSystem, false))
      .all();

    const id = newId();
    tx.insert(category)
      .values({ id, name: trimmed, sortOrder: (last ?? -1) + 1, isSystem: false })
      .run();
    return id;
  });
}

/**
 * Inline-Umbenennen (5a). „Sonstiges“ ist nicht umbenennbar; ein vergebener Name wird abgelehnt.
 * Eine umbenannte Standard-Kategorie verliert ihren Schlüssel und behält den Namen in jeder Sprache;
 * bleibt der angezeigte Name gleich, ändert sich nichts.
 */
export function renameCategory(id: string, name: string): boolean {
  return db.transaction((tx) => {
    const trimmed = normalizeCategoryName(name);
    const row = tx.select().from(category).where(eq(category.id, id)).get();
    if (!trimmed || !row || row.isSystem) return false;
    if (trimmed === categoryLabel(row.key, row.name)) return true;
    if (isNameTaken(trimmed, categoryNames(id))) return false;
    tx.update(category).set({ name: trimmed, key: null }).where(eq(category.id, id)).run();
    return true;
  });
}

/** Ziehen (5b): neue Ladenreihenfolge aller Kategorien außer „Sonstiges“. */
export function reorderCategories(orderedIds: string[]) {
  db.transaction((tx) => {
    orderedIds.forEach((id, index) => {
      tx.update(category).set({ sortOrder: index }).where(eq(category.id, id)).run();
    });
  });
}

/** Löschen (5a): Produkte der Kategorie wandern nach „Sonstiges“. „Sonstiges“ selbst bleibt. */
export function deleteCategory(id: string) {
  db.transaction((tx) => {
    const row = tx.select().from(category).where(eq(category.id, id)).get();
    const systemId = getSystemCategoryId();
    if (!row || row.isSystem || !systemId) return;
    tx.update(product).set({ categoryId: systemId }).where(eq(product.categoryId, id)).run();
    tx.delete(category).where(eq(category.id, id)).run();
  });
}
