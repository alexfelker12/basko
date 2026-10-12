import { eq, isNotNull, notExists } from "drizzle-orm";

import type { Database } from ".";
import { list, listItem, recipe } from "./schema";

/**
 * Löscht Zeilen mit gesetztem `deletedAt` endgültig.
 * Läuft bei jedem App-Start – ein Schließen der App während des Rückgängig-Toasts löscht also trotzdem.
 * (Listeneinträge gelöschter Listen gehen per Fremdschlüssel-Cascade mit.)
 */
export function purgeSoftDeleted(db: Database) {
  db.transaction((tx) => {
    tx.delete(listItem).where(isNotNull(listItem.deletedAt)).run();
    tx.delete(list).where(isNotNull(list.deletedAt)).run();
  });
  deleteOrphanRecipes(db);
}

/**
 * Gespeicherte Rezepte leben mit ihren Listen: Zeigt keine Liste mehr darauf (auch keine, die
 * gerade auf Rückgängig wartet), wird das Rezept gelöscht. Ohne eigene Transaktion.
 */
export function deleteOrphanRecipes(db: Database) {
  db.delete(recipe)
    .where(notExists(db.select({ id: list.id }).from(list).where(eq(list.recipeId, recipe.id))))
    .run();
}
