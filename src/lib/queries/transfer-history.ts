import { desc, eq, notInArray } from "drizzle-orm";

import { db } from "@/lib/db";
import { newId } from "@/lib/db/id";
import {
  list,
  TRANSFER_HISTORY_MAX,
  transferHistory,
  type TransferDirection,
} from "@/lib/db/schema";

export type HistoryEntry = {
  id: string;
  direction: TransferDirection;
  listId: string;
  listName: string;
  peerName: string | null;
  createdAt: Date;
};

/** Verlauf (6a), neueste zuerst, max. 20. */
export function getTransferHistory(): HistoryEntry[] {
  return db
    .select()
    .from(transferHistory)
    .orderBy(desc(transferHistory.createdAt))
    .limit(TRANSFER_HISTORY_MAX)
    .all();
}

/** Neuer Verlaufseintrag; ältere über 20 hinaus werden gelöscht. */
export function addTransferHistory(entry: {
  direction: TransferDirection;
  listId: string;
  listName: string;
  peerName?: string | null;
}) {
  db.transaction(() => {
    db.insert(transferHistory)
      .values({
        id: newId(),
        direction: entry.direction,
        listId: entry.listId,
        listName: entry.listName,
        peerName: entry.peerName ?? null,
        createdAt: new Date(),
      })
      .run();

    const keep = db
      .select({ id: transferHistory.id })
      .from(transferHistory)
      .orderBy(desc(transferHistory.createdAt))
      .limit(TRANSFER_HISTORY_MAX)
      .all()
      .map((row) => row.id);
    db.delete(transferHistory).where(notInArray(transferHistory.id, keep)).run();
  });
}

/** „Verlauf leeren“ (6a). */
export function clearTransferHistory() {
  db.delete(transferHistory).run();
}

/** Liste eines Verlaufseintrags – gibt es sie noch (sichtbar, nicht gelöscht)? */
export function historyListExists(listId: string): boolean {
  const row = db.select({ deletedAt: list.deletedAt }).from(list).where(eq(list.id, listId)).get();
  return row !== undefined && row.deletedAt === null;
}
