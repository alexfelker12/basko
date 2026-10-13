import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

/** Max. Länge eines Kategorienamens (Spezifikation → Datenmodell). */
export const CATEGORY_NAME_MAX = 40;

/**
 * Kategorie mit Ladenreihenfolge (`sortOrder`). Genau eine Systemkategorie „Sonstiges“
 * (`isSystem`), die immer am Ende steht und nicht umbenannt oder gelöscht werden kann.
 * Namen sind eindeutig ohne Beachtung der Groß-/Kleinschreibung – vollständig (inkl. Umlaute)
 * prüft das die App; der Index ist das Sicherheitsnetz (SQLite `lower()` kennt nur ASCII).
 * `key`: Standard-Kategorien und „Sonstiges“ (`seed.categories.<key>`) – angezeigt wird dann der
 * Name in der aktiven Sprache (`categoryLabel`), `name` hält nur den Namen vom Anlegen. Eigene und
 * umbenannte Kategorien haben `null`.
 */
export const category = sqliteTable(
  "category",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").notNull(),
    isSystem: integer("is_system", { mode: "boolean" }).notNull().default(false),
    key: text("key"),
  },
  (t) => [
    uniqueIndex("category_key_unique").on(t.key),
    uniqueIndex("category_name_unique").on(sql`lower(${t.name})`),
    uniqueIndex("category_single_system")
      .on(t.isSystem)
      .where(sql`${t.isSystem} = 1`),
  ]
);

export type Category = typeof category.$inferSelect;
export type NewCategory = typeof category.$inferInsert;
