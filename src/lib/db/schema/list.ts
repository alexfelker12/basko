import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { LIST_COLORS } from "../../list-colors";

/** Einkaufsliste. Sortiert nach `lastUsedAt` absteigend; `deletedAt` = Soft-Delete (Rückgängig). */
export const list = sqliteTable(
  "list",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    color: text("color", { enum: LIST_COLORS }).notNull().default("green"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    lastUsedAt: integer("last_used_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
  },
  (t) => [index("list_last_used_at_idx").on(t.lastUsedAt)]
);

export type List = typeof list.$inferSelect;
export type NewList = typeof list.$inferInsert;
