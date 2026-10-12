import { and, count, desc, eq, isNotNull, isNull, ne } from "drizzle-orm";

import { db } from "@/lib/db";
import { deleteOrphanRecipes } from "@/lib/db/purge";
import { newId } from "@/lib/db/id";
import { list, listItem } from "@/lib/db/schema";
import { t } from "@/lib/i18n";
import type { ListColor } from "@/lib/list-colors";
import { resolveListName } from "@/lib/list-name";

export type ListSummary = {
  id: string;
  name: string;
  color: ListColor;
  /** Anzahl Einträge (kein Fortschritt), 1a. */
  itemCount: number;
};

const summaryFields = {
  id: list.id,
  name: list.name,
  color: list.color,
  itemCount: count(listItem.id),
};

/** Alle Listen, die zuletzt benutzte zuerst (1a). Gelöschte (Rückgängig ausstehend) bleiben ausgeblendet. */
export function getLists(): ListSummary[] {
  return db
    .select(summaryFields)
    .from(list)
    .leftJoin(listItem, and(eq(listItem.listId, list.id), isNull(listItem.deletedAt)))
    .where(isNull(list.deletedAt))
    .groupBy(list.id)
    .orderBy(desc(list.lastUsedAt))
    .all();
}

export function getListSummary(id: string): ListSummary | null {
  return (
    db
      .select(summaryFields)
      .from(list)
      .leftJoin(listItem, and(eq(listItem.listId, list.id), isNull(listItem.deletedAt)))
      .where(and(eq(list.id, id), isNull(list.deletedAt)))
      .groupBy(list.id)
      .get() ?? null
  );
}

/** Namen aller sichtbaren Listen – Grundlage der Namensregel „(n)“. */
function takenListNames(excludeId?: string): string[] {
  return db
    .select({ name: list.name })
    .from(list)
    .where(excludeId ? and(isNull(list.deletedAt), ne(list.id, excludeId)) : isNull(list.deletedAt))
    .all()
    .map((row) => row.name);
}

/** Neue Liste (1f, 7e); Name nach Namensregel, optional mit Rezept. Liefert die ID. */
export function createList(name: string, color: ListColor, recipeId: string | null = null): string {
  const id = newId();
  const now = new Date();
  db.insert(list)
    .values({
      id,
      name: resolveListName(name, takenListNames()),
      color,
      createdAt: now,
      lastUsedAt: now,
      recipeId,
    })
    .run();
  return id;
}

/** Umbenennen (1d). Ein leerer Name wird verworfen (`null`), sonst gilt die Namensregel. */
export function renameList(id: string, name: string): string | null {
  if (!name.trim()) return null;
  const resolved = resolveListName(name, takenListNames(id));
  db.update(list).set({ name: resolved }).where(eq(list.id, id)).run();
  return resolved;
}

export function setListColor(id: string, color: ListColor) {
  db.update(list).set({ color, lastUsedAt: new Date() }).where(eq(list.id, id)).run();
}

/** `lastUsedAt` bei jeder Interaktion: Einkaufsmodus öffnen, abhaken, bearbeiten, hinzufügen. */
export function touchList(id: string) {
  db.update(list).set({ lastUsedAt: new Date() }).where(eq(list.id, id)).run();
}

/**
 * Duplizieren (1e): „Kopie von {Name}“ nach Namensregel, gleiche Farbe, gleiches Rezept,
 * alle Einträge mit zurückgesetzten Haken. Liefert die ID der Kopie.
 */
export function duplicateList(id: string): string | null {
  return db.transaction((tx) => {
    const source = tx.select().from(list).where(eq(list.id, id)).get();
    if (!source) return null;

    const copyId = newId();
    const now = new Date();
    tx.insert(list)
      .values({
        id: copyId,
        name: resolveListName(t("lists.copyOf", { name: source.name }), takenListNames()),
        color: source.color,
        createdAt: now,
        lastUsedAt: now,
        recipeId: source.recipeId,
      })
      .run();

    const items = tx
      .select()
      .from(listItem)
      .where(and(eq(listItem.listId, id), isNull(listItem.deletedAt)))
      .all();
    if (items.length > 0) {
      tx.insert(listItem)
        .values(
          items.map((item) => ({
            id: newId(),
            listId: copyId,
            productId: item.productId,
            quantity: item.quantity,
            unit: item.unit,
            note: item.note,
            checked: false,
            createdAt: now,
          }))
        )
        .run();
    }
    return copyId;
  });
}

/** Löschen mit Rückgängig: sofort ausblenden … */
export function softDeleteList(id: string) {
  db.update(list).set({ deletedAt: new Date() }).where(eq(list.id, id)).run();
}

/** … Rückgängig setzt das Feld zurück … */
export function restoreList(id: string) {
  db.update(list).set({ deletedAt: null }).where(eq(list.id, id)).run();
}

/** … nach 5 s endgültig löschen (Einträge per Cascade, Rezept ohne weitere Liste mit). */
export function purgeList(id: string) {
  db.delete(list).where(and(eq(list.id, id), isNotNull(list.deletedAt))).run();
  deleteOrphanRecipes(db);
}
