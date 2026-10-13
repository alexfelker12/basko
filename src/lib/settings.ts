import * as Device from "expo-device";
import { z } from "zod";

import type { Database } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { THEME_MODES } from "@/lib/theme";

/** Max. Länge des Gerätenamens (8b). */
export const DEVICE_NAME_MAX = 30;

export const PRODUCTS_VIEWS = ["list", "grid"] as const;
export type ProductsView = (typeof PRODUCTS_VIEWS)[number];

/**
 * Vorbelegung des Gerätenamens: Name von expo-device (iOS liefert nur „iPhone“),
 * sonst das Modell. Nicht übersetzt, weil es ein Name und kein UI-Text ist.
 */
export function getDefaultDeviceName(): string {
  const name = (Device.deviceName ?? Device.modelName ?? "Basko").trim();
  return (name || "Basko").slice(0, DEVICE_NAME_MAX);
}

/** Strenge Regeln für das Schreiben einzelner Einstellungen. */
export const settingSchemas = {
  theme: z.enum(THEME_MODES),
  deviceName: z.string().trim().min(1).max(DEVICE_NAME_MAX),
  productsView: z.enum(PRODUCTS_VIEWS),
  /** Ordner für „Sichern“ (8c, nur Android): Tree-URI aus der Ordnerauswahl des Systems. */
  backupDirectory: z.string().min(1).nullable(),
};

/** Lesen ist tolerant: fehlende oder ungültige Werte fallen auf den Standard zurück. */
const settingsReadSchema = z.object({
  theme: settingSchemas.theme.catch("system"),
  deviceName: settingSchemas.deviceName.catch(() => getDefaultDeviceName()),
  productsView: settingSchemas.productsView.catch("list"),
  backupDirectory: settingSchemas.backupDirectory.catch(null),
});

export type Settings = z.infer<typeof settingsReadSchema>;
export type SettingKey = keyof Settings;

/**
 * Liest alle Einstellungen synchron – beim Start, bevor der Splash verschwindet
 * (Spezifikation → 8 Einstellungen).
 */
export function readSettings(db: Database): Settings {
  const rows = db.select().from(settings).all();
  const raw = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  return settingsReadSchema.parse(raw);
}

/** Eine einzelne Änderung, z. B. `{ key: "theme", value: "dark" }`. */
export type SettingUpdate = {
  [K in SettingKey]: { key: K; value: Settings[K] };
}[SettingKey];

/** Schreibt eine Einstellung (Upsert). Wirft bei ungültigem Wert. */
export function writeSetting(db: Database, { key, value }: SettingUpdate) {
  const parsed = settingSchemas[key].parse(value);
  db.insert(settings)
    .values({ key, value: parsed })
    .onConflictDoUpdate({ target: settings.key, set: { value: parsed } })
    .run();
}
