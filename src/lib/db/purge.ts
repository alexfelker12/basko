import { isNotNull } from "drizzle-orm";

import type { Database } from ".";
import { list, listItem } from "./schema";

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
}
