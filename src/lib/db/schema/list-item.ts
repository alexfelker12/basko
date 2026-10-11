import { sql } from "drizzle-orm";
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

import { UNITS } from "../../units";
import { list } from "./list";
import { product } from "./product";

/** Max. Länge der Notiz eines Eintrags. */
export const LIST_ITEM_NOTE_MAX = 100;

/**
 * Eintrag einer Liste: verweist auf ein Produkt und trägt Menge (> 0, max. 2 Nachkommastellen),
 * Einheit und Notiz. Pro Liste steht ein Produkt höchstens einmal (aktive Einträge).
 */
export const listItem = sqliteTable(
  "list_item",
  {
    id: text("id").primaryKey(),
    listId: text("list_id")
      .notNull()
      .references(() => list.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    quantity: real("quantity").notNull(),
    unit: text("unit", { enum: UNITS }).notNull(),
    note: text("note"),
    checked: integer("checked", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
  },
  (t) => [
    index("list_item_list_id_idx").on(t.listId),
    index("list_item_product_id_idx").on(t.productId),
    uniqueIndex("list_item_list_product_unique")
      .on(t.listId, t.productId)
      .where(sql`${t.deletedAt} is null`),
  ]
);

export type ListItem = typeof listItem.$inferSelect;
export type NewListItem = typeof listItem.$inferInsert;
