import { sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Einstellungen als Schlüssel/Wert, Wert als JSON.
 * Schlüssel und Typen: `src/lib/settings.ts` (theme, language, deviceName, productsView, backupDirectory).
 */
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value", { mode: "json" }).notNull(),
});

export type SettingRow = typeof settings.$inferSelect;
