import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const TRANSFER_DIRECTIONS = ["sent", "received", "exported", "imported"] as const;
export type TransferDirection = (typeof TRANSFER_DIRECTIONS)[number];

/** Max. Einträge im Verlauf (6a). */
export const TRANSFER_HISTORY_MAX = 20;

/**
 * Transfer-Verlauf. `listId` ohne Fremdschlüssel: die Liste kann inzwischen gelöscht sein
 * („{Name} existiert nicht mehr“). `peerName` fehlt bei Export/Import.
 */
export const transferHistory = sqliteTable(
  "transfer_history",
  {
    id: text("id").primaryKey(),
    direction: text("direction", { enum: TRANSFER_DIRECTIONS }).notNull(),
    listId: text("list_id").notNull(),
    listName: text("list_name").notNull(),
    peerName: text("peer_name"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("transfer_history_created_at_idx").on(t.createdAt)]
);

export type TransferHistoryEntry = typeof transferHistory.$inferSelect;
export type NewTransferHistoryEntry = typeof transferHistory.$inferInsert;
