import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { LIST_COLORS } from "../../list-colors";
import { recipe } from "./recipe";

/**
 * Einkaufsliste. Sortiert nach `lastUsedAt` absteigend; `deletedAt` = Soft-Delete (Rückgängig).
 * `recipeId`: aus einem Rezept erstellt (7e) – das Rezept bleibt im Rezepte-Tab erreichbar.
 */
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
    recipeId: text("recipe_id").references(() => recipe.id, { onDelete: "set null" }),
  },
  (t) => [
    index("list_last_used_at_idx").on(t.lastUsedAt),
    index("list_recipe_id_idx").on(t.recipeId),
  ]
);

export type List = typeof list.$inferSelect;
export type NewList = typeof list.$inferInsert;
