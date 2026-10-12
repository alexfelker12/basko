import { z } from "zod";

import {
  CATEGORY_NAME_MAX,
  LIST_ITEM_NOTE_MAX,
  PRODUCT_IMAGES_MAX,
  PRODUCT_NAME_MAX,
} from "@/lib/db/schema";
import { LIST_COLORS } from "@/lib/list-colors";
import { PRODUCTS_VIEWS } from "@/lib/settings";
import { THEME_MODES } from "@/lib/theme";
import {
  assertFormatVersion,
  encodeContainer,
  TransferFormatError,
  type DecodedContainer,
  type TransferImages,
} from "@/lib/transfer/format";
import { UNITS } from "@/lib/units";

/**
 * Sicherung (`.baskobackup`, Spezifikation → 8 · Sicherung): derselbe Binärrahmen wie der
 * Listen-Transfer (`encodeContainer`), JSON mit `type: "backup"`. Enthalten sind alle Listen mit
 * Haken-Zustand, Produkte mit Fotos, Kategorien samt Reihenfolge, gespeicherte Rezepte sowie
 * Darstellung und Produktansicht – nicht Gerätename und Transfer-Verlauf. IDs bleiben erhalten,
 * Zeitpunkte stehen als Millisekunden. Fotos liegen unter ihrem Dateinamen im Bildteil.
 */
export const BACKUP_FORMAT_VERSION = 1;
export const BACKUP_FILE_EXTENSION = ".baskobackup";
export const BACKUP_MIME_TYPE = "application/x-basko-backup";
export const BACKUP_UTI = "com.alexfelker.basko.backup";

const id = z.string().min(1).max(64);
const timestamp = z.number().int().nonnegative();

const categorySchema = z.object({
  id,
  name: z.string().trim().min(1).max(CATEGORY_NAME_MAX),
  sortOrder: z.number().int(),
  isSystem: z.boolean(),
});

const productSchema = z.object({
  id,
  name: z.string().trim().min(1).max(PRODUCT_NAME_MAX),
  categoryId: id,
  lastQuantity: z.number().positive().nullable(),
  lastUnit: z.enum(UNITS).nullable(),
  lastUsedAt: timestamp.nullable(),
  createdAt: timestamp,
  /** Dateinamen der Fotos in Reihenfolge (das erste ist das Vorschaubild). */
  images: z.array(z.string().min(1).max(200)).max(PRODUCT_IMAGES_MAX),
});

const recipeSchema = z.object({
  id,
  title: z.string().trim().min(1).max(500),
  servings: z.string().max(200).nullable(),
  ingredients: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(500),
        quantity: z.number().nullable(),
        unit: z.string().max(100).nullable(),
      })
    )
    .max(500),
  instructions: z.array(z.string().max(10_000)).max(500),
  calories: z.number().nullable(),
  protein: z.number().nullable(),
  carbs: z.number().nullable(),
  fat: z.number().nullable(),
  createdAt: timestamp,
});

const listItemSchema = z.object({
  id,
  productId: id,
  quantity: z.number().positive(),
  unit: z.enum(UNITS),
  note: z.string().max(LIST_ITEM_NOTE_MAX).nullable(),
  checked: z.boolean(),
  createdAt: timestamp,
});

const listSchema = z.object({
  id,
  name: z.string().trim().min(1).max(200),
  color: z.enum(LIST_COLORS),
  createdAt: timestamp,
  lastUsedAt: timestamp,
  recipeId: id.nullable(),
  items: z.array(listItemSchema),
});

const backupSchema = z.object({
  formatVersion: z.literal(BACKUP_FORMAT_VERSION),
  type: z.literal("backup"),
  /** Zeitpunkt der Sicherung – steht im Dialog „Daten ersetzen?“ (8e). */
  createdAt: timestamp,
  appVersion: z.string().max(50).nullable(),
  settings: z.object({
    theme: z.enum(THEME_MODES),
    productsView: z.enum(PRODUCTS_VIEWS),
  }),
  categories: z.array(categorySchema),
  products: z.array(productSchema),
  recipes: z.array(recipeSchema),
  lists: z.array(listSchema),
});

export type BackupPayload = z.infer<typeof backupSchema>;
export type BackupCategory = BackupPayload["categories"][number];
export type BackupProduct = BackupPayload["products"][number];
export type BackupRecipe = BackupPayload["recipes"][number];
export type BackupList = BackupPayload["lists"][number];

export type DecodedBackup = { payload: BackupPayload; images: TransferImages };

export function encodeBackup(payload: BackupPayload, images: TransferImages) {
  return encodeContainer(payload, images);
}

/**
 * Prüft ein gelesenes Paket als Sicherung. Wirft `TransferFormatError` – `newerVersion` bei einer
 * Sicherung aus einer neueren App-Version, sonst `corrupt` (auch wenn Verweise ins Leere zeigen).
 */
export function parseBackup({ raw, images }: DecodedContainer): DecodedBackup {
  assertFormatVersion(raw, BACKUP_FORMAT_VERSION);
  const parsed = backupSchema.safeParse(raw);
  if (!parsed.success) throw new TransferFormatError("invalid backup");
  const payload = parsed.data;

  // Verweise prüfen, bevor etwas ersetzt wird – die Datenbank würde sonst mitten im Ersetzen
  // an Fremdschlüsseln oder eindeutigen Namen scheitern
  const categoryIds = new Set(payload.categories.map((category) => category.id));
  const productIds = new Set(payload.products.map((product) => product.id));
  const recipeIds = new Set(payload.recipes.map((recipe) => recipe.id));
  const valid =
    payload.categories.filter((category) => category.isSystem).length === 1 &&
    categoryIds.size === payload.categories.length &&
    productIds.size === payload.products.length &&
    payload.products.every((product) => categoryIds.has(product.categoryId)) &&
    payload.lists.every(
      (list) =>
        (list.recipeId === null || recipeIds.has(list.recipeId)) &&
        list.items.every((item) => productIds.has(item.productId)) &&
        new Set(list.items.map((item) => item.productId)).size === list.items.length
    ) &&
    unique(payload.categories.map((category) => category.name)) &&
    unique(payload.products.map((product) => product.name));
  if (!valid) throw new TransferFormatError("inconsistent backup");

  return { payload, images };
}

/** Namen eindeutig ohne Beachtung der Groß-/Kleinschreibung (wie in der App). */
function unique(names: string[]): boolean {
  return new Set(names.map((name) => name.trim().toLocaleLowerCase("de"))).size === names.length;
}

/** Dateiname der Sicherung: `basko-sicherung-JJJJ-MM-TT.baskobackup` (lokales Datum). */
export function backupFileName(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return `basko-sicherung-${day}${BACKUP_FILE_EXTENSION}`;
}
