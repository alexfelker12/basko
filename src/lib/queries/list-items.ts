import { and, asc, eq, isNotNull, isNull, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { newId } from "@/lib/db/id";
import { category, listItem, product, productImage } from "@/lib/db/schema";
import type { Unit } from "@/lib/units";

import { touchList } from "./lists";

export type ListItemRow = {
  id: string;
  listId: string;
  productId: string;
  productName: string;
  categoryId: string;
  categoryName: string;
  categoryIsSystem: boolean;
  categorySortOrder: number;
  quantity: number;
  unit: Unit;
  note: string | null;
  checked: boolean;
  /** Erstes Foto des Produkts (Vorschaubild), sonst `null`. */
  thumbnailFileName: string | null;
};

const firstImage = db
  .select({ fileName: productImage.fileName })
  .from(productImage)
  .where(eq(productImage.productId, product.id))
  .orderBy(asc(productImage.sortOrder))
  .limit(1);

/** Alle sichtbaren Einträge einer Liste mit Produkt und Kategorie. Sortiert wird in `lib/list-grouping`. */
export function getListItems(listId: string): ListItemRow[] {
  return db
    .select({
      id: listItem.id,
      listId: listItem.listId,
      productId: listItem.productId,
      productName: product.name,
      categoryId: category.id,
      categoryName: category.name,
      categoryIsSystem: category.isSystem,
      categorySortOrder: category.sortOrder,
      quantity: listItem.quantity,
      unit: listItem.unit,
      note: listItem.note,
      checked: listItem.checked,
      thumbnailFileName: sql<string | null>`(${firstImage})`,
    })
    .from(listItem)
    .innerJoin(product, eq(product.id, listItem.productId))
    .innerJoin(category, eq(category.id, product.categoryId))
    .where(and(eq(listItem.listId, listId), isNull(listItem.deletedAt)))
    .all();
}

export type ItemValues = {
  quantity: number;
  unit: Unit;
  note: string | null;
};

function normalizeNote(note: string | null): string | null {
  const trimmed = note?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

/** Vorbelegung fürs nächste Hinzufügen: zuletzt benutzte Menge/Einheit des Produkts. */
function rememberProductUsage(productId: string, values: Pick<ItemValues, "quantity" | "unit">) {
  db.update(product)
    .set({ lastQuantity: values.quantity, lastUnit: values.unit, lastUsedAt: new Date() })
    .where(eq(product.id, productId))
    .run();
}

/** Hinzufügen (3e). Liefert die ID des Eintrags. */
export function addListItem(listId: string, productId: string, values: ItemValues): string {
  return db.transaction(() => {
    // Ein noch auf Rückgängig wartender Eintrag desselben Produkts wird sofort endgültig gelöscht,
    // sonst kollidiert er mit dem neuen (ein Produkt steht höchstens einmal in einer Liste).
    db.delete(listItem)
      .where(
        and(
          eq(listItem.listId, listId),
          eq(listItem.productId, productId),
          isNotNull(listItem.deletedAt)
        )
      )
      .run();

    const id = newId();
    db.insert(listItem)
      .values({
        id,
        listId,
        productId,
        quantity: values.quantity,
        unit: values.unit,
        note: normalizeNote(values.note),
        checked: false,
        createdAt: new Date(),
      })
      .run();

    rememberProductUsage(productId, values);
    touchList(listId);
    return id;
  });
}

/** Menge/Einheit/Notiz ändern (Mengenregler, Bearbeiten-Sheet, Schnell-Bearbeiten). */
export function updateListItem(id: string, values: Partial<ItemValues>) {
  db.transaction(() => {
    const item = db.select().from(listItem).where(eq(listItem.id, id)).get();
    if (!item) return;

    const next = {
      quantity: values.quantity ?? item.quantity,
      unit: values.unit ?? item.unit,
      note: values.note === undefined ? item.note : normalizeNote(values.note),
    };
    db.update(listItem).set(next).where(eq(listItem.id, id)).run();

    rememberProductUsage(item.productId, next);
    touchList(item.listId);
  });
}

/** Abhaken (2a). */
export function setListItemChecked(id: string, checked: boolean) {
  db.transaction(() => {
    const item = db
      .select({ listId: listItem.listId })
      .from(listItem)
      .where(eq(listItem.id, id))
      .get();
    if (!item) return;
    db.update(listItem).set({ checked }).where(eq(listItem.id, id)).run();
    touchList(item.listId);
  });
}

/** „Haken zurücksetzen“ / „Alle Haken entfernen?“ (2). */
export function resetListChecks(listId: string) {
  db.transaction(() => {
    db.update(listItem).set({ checked: false }).where(eq(listItem.listId, listId)).run();
    touchList(listId);
  });
}

export function softDeleteListItem(id: string) {
  db.transaction(() => {
    const item = db
      .select({ listId: listItem.listId })
      .from(listItem)
      .where(eq(listItem.id, id))
      .get();
    db.update(listItem).set({ deletedAt: new Date() }).where(eq(listItem.id, id)).run();
    if (item) touchList(item.listId);
  });
}

export function restoreListItem(id: string) {
  db.update(listItem).set({ deletedAt: null }).where(eq(listItem.id, id)).run();
}

export function purgeListItem(id: string) {
  db.delete(listItem).where(and(eq(listItem.id, id), isNotNull(listItem.deletedAt))).run();
}
