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
import { category } from "./category";

/** Max. Länge eines Produktnamens (Spezifikation → Datenmodell). */
export const PRODUCT_NAME_MAX = 100;
/** Max. Fotos pro Produkt; das erste ist das Vorschaubild. */
export const PRODUCT_IMAGES_MAX = 8;

/**
 * Globaler Produktkatalog. Menge, Einheit und Notiz hängen am Listeneintrag –
 * `lastQuantity`/`lastUnit`/`lastUsedAt` dienen nur der Vorbelegung und Schnellauswahl.
 */
export const product = sqliteTable(
  "product",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    categoryId: text("category_id")
      .notNull()
      .references(() => category.id, { onDelete: "restrict" }),
    lastQuantity: real("last_quantity"),
    lastUnit: text("last_unit", { enum: UNITS }),
    lastUsedAt: integer("last_used_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    uniqueIndex("product_name_unique").on(sql`lower(${t.name})`),
    index("product_category_id_idx").on(t.categoryId),
    index("product_last_used_at_idx").on(t.lastUsedAt),
  ]
);

/** Fotos eines Produkts; Dateien liegen im Dokumente-Ordner der App. */
export const productImage = sqliteTable(
  "product_image",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    fileName: text("file_name").notNull(),
    sortOrder: integer("sort_order").notNull(),
  },
  (t) => [index("product_image_product_id_idx").on(t.productId)]
);

export type Product = typeof product.$inferSelect;
export type NewProduct = typeof product.$inferInsert;
export type ProductImage = typeof productImage.$inferSelect;
export type NewProductImage = typeof productImage.$inferInsert;
