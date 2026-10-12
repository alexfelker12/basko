import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import Constants from "expo-constants";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

import { db } from "@/lib/db";
import { category, list, listItem, product, productImage, recipe } from "@/lib/db/schema";
import { PRODUCT_IMAGES_DIR } from "@/lib/images";
import { readSettings } from "@/lib/settings";
import { freshCacheDirectory } from "@/lib/transfer/file";
import type { TransferImages } from "@/lib/transfer/format";

import {
  BACKUP_FORMAT_VERSION,
  BACKUP_MIME_TYPE,
  BACKUP_UTI,
  backupFileName,
  encodeBackup,
  type BackupPayload,
} from "./format";

const BACKUP_DIR = "basko-backup";

const ms = (date: Date) => date.getTime();

/**
 * Liest alles, was in die Sicherung gehört: sichtbare Listen (Gelöschtes, das noch auf
 * Rückgängig wartet, nicht) mit Haken-Zustand, alle Produkte mit Fotos, Kategorien,
 * die Rezepte dieser Listen und Darstellung/Produktansicht. Fehlende Fotodateien fallen weg.
 */
export async function buildBackup(): Promise<{ payload: BackupPayload; images: TransferImages }> {
  const settings = readSettings(db);
  const categories = db.select().from(category).orderBy(asc(category.sortOrder)).all();

  const imageRows = db
    .select()
    .from(productImage)
    .orderBy(asc(productImage.productId), asc(productImage.sortOrder))
    .all();
  const images: TransferImages = new Map();
  const imagesByProduct = new Map<string, string[]>();
  for (const row of imageRows) {
    const file = new File(Paths.document, PRODUCT_IMAGES_DIR, row.fileName);
    if (!file.exists) continue;
    if (!images.has(row.fileName)) images.set(row.fileName, await file.bytes());
    imagesByProduct.set(row.productId, [
      ...(imagesByProduct.get(row.productId) ?? []),
      row.fileName,
    ]);
  }

  const products = db
    .select()
    .from(product)
    .all()
    .map((row) => ({
      id: row.id,
      name: row.name,
      categoryId: row.categoryId,
      lastQuantity: row.lastQuantity,
      lastUnit: row.lastUnit,
      lastUsedAt: row.lastUsedAt ? ms(row.lastUsedAt) : null,
      createdAt: ms(row.createdAt),
      images: imagesByProduct.get(row.id) ?? [],
    }));

  const lists = db.select().from(list).where(isNull(list.deletedAt)).all();
  const items = db
    .select({ item: listItem })
    .from(listItem)
    .innerJoin(list, eq(list.id, listItem.listId))
    .where(and(isNull(listItem.deletedAt), isNull(list.deletedAt)))
    .all()
    .map((row) => row.item);

  const recipeIds = [...new Set(lists.flatMap((row) => (row.recipeId ? [row.recipeId] : [])))];
  const recipes =
    recipeIds.length > 0 ? db.select().from(recipe).where(inArray(recipe.id, recipeIds)).all() : [];

  return {
    payload: {
      formatVersion: BACKUP_FORMAT_VERSION,
      type: "backup",
      createdAt: Date.now(),
      appVersion: Constants.expoConfig?.version ?? null,
      settings: { theme: settings.theme, productsView: settings.productsView },
      categories: categories.map(({ id, name, sortOrder, isSystem }) => ({
        id,
        name,
        sortOrder,
        isSystem,
      })),
      products,
      recipes: recipes.map((row) => ({ ...row, createdAt: ms(row.createdAt) })),
      lists: lists.map((row) => ({
        id: row.id,
        name: row.name,
        color: row.color,
        createdAt: ms(row.createdAt),
        lastUsedAt: ms(row.lastUsedAt),
        recipeId: row.recipeId,
        items: items
          .filter((item) => item.listId === row.id)
          .map((item) => ({
            id: item.id,
            productId: item.productId,
            quantity: item.quantity,
            unit: item.unit,
            note: item.note,
            checked: item.checked,
            createdAt: ms(item.createdAt),
          })),
      })),
    },
    images,
  };
}

/**
 * „Sichern“ (8c): schreibt `basko-sicherung-JJJJ-MM-TT.baskobackup` in den Cache und öffnet das
 * Teilen-Menü. Kehrt zurück, sobald das Teilen-Menü geschlossen ist (8d: dann der Toast).
 */
export async function exportBackupFile(): Promise<void> {
  const { payload, images } = await buildBackup();
  const file = new File(
    freshCacheDirectory(BACKUP_DIR),
    backupFileName(new Date(payload.createdAt))
  );
  file.create({ overwrite: true });
  file.write(encodeBackup(payload, images));

  await Sharing.shareAsync(file.uri, {
    mimeType: BACKUP_MIME_TYPE,
    UTI: BACKUP_UTI,
    dialogTitle: file.name,
  });
}
