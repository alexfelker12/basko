import { Directory, File, Paths } from "expo-file-system";

import { defaultCategoryKeyForName, SYSTEM_CATEGORY_KEY } from "@/lib/category-name";
import { db } from "@/lib/db";
import { newId } from "@/lib/db/id";
import { seedDatabase } from "@/lib/db/seed";
import { category, list, listItem, product, productImage, recipe } from "@/lib/db/schema";
import { deleteProductImageFiles, PRODUCT_IMAGES_DIR } from "@/lib/images";
import { writeSetting } from "@/lib/settings";
import { readFileBytes } from "@/lib/transfer/file";
import { decodeContainer } from "@/lib/transfer/format";

import { parseBackup, type BackupPayload, type DecodedBackup } from "./format";

/** Mehrzeilige Inserts in Blöcken – SQLite begrenzt die Zahl der Parameter pro Anweisung. */
const CHUNK = 200;

function insertChunked<T>(rows: T[], insert: (chunk: T[]) => void) {
  for (let start = 0; start < rows.length; start += CHUNK) {
    insert(rows.slice(start, start + CHUNK));
  }
}

/** Liest eine gewählte bzw. geöffnete `.baskobackup`-Datei. Wirft `TransferFormatError`. */
export async function readBackupFile(uri: string): Promise<DecodedBackup> {
  return parseBackup(decodeContainer(await readFileBytes(uri)));
}

/**
 * Sicherungen vor Phase 7 kennen keine Kategorie-Schlüssel: „Sonstiges“ über `isSystem`, Standard-
 * Kategorien über ihren Standardnamen (in irgendeiner Sprache), jeder Schlüssel nur einmal.
 */
function categoriesWithKeys(categories: BackupPayload["categories"]) {
  const used = new Set(categories.flatMap((entry) => (entry.key ? [entry.key] : [])));
  return categories.map((entry) => {
    if (entry.key !== undefined) return { ...entry, key: entry.key };
    const key = entry.isSystem ? SYSTEM_CATEGORY_KEY : defaultCategoryKeyForName(entry.name);
    if (!key || used.has(key)) return { ...entry, key: null };
    used.add(key);
    return { ...entry, key };
  });
}

/** Dateiendung eines Fotos aus der Sicherung, sonst `.jpg`. */
function imageExtension(fileName: string): string {
  return fileName.match(/\.[a-z0-9]{1,5}$/i)?.[0].toLowerCase() ?? ".jpg";
}

/**
 * „Wiederherstellen“ (8e): ersetzt alle Listen, Produkte (mit Fotos), Kategorien und
 * gespeicherten Rezepte durch die Sicherung und übernimmt Darstellung und Produktansicht.
 * Gerätename und Transfer-Verlauf bleiben. Ablauf wie beim Listen-Import: Fotos zuerst als neue
 * Dateien schreiben, dann eine Transaktion; erst danach die alten Fotodateien löschen.
 * Schlägt die Transaktion fehl, bleibt alles beim Alten.
 */
export function restoreBackup({ payload, images }: DecodedBackup): BackupPayload["settings"] {
  const directory = new Directory(Paths.document, PRODUCT_IMAGES_DIR);
  if (!directory.exists) directory.create({ intermediates: true, idempotent: true });
  const previousFiles = db.select({ fileName: productImage.fileName }).from(productImage).all();

  // Schritt 1: Fotos unter neuen Namen schreiben – kein Konflikt mit vorhandenen Dateien
  const written: string[] = [];
  const imageRows: (typeof productImage.$inferInsert)[] = [];
  try {
    for (const entry of payload.products) {
      let sortOrder = 0;
      for (const name of entry.images) {
        const bytes = images.get(name);
        if (!bytes) continue;
        const fileName = `${newId()}${imageExtension(name)}`;
        const file = new File(directory, fileName);
        file.create({ overwrite: true });
        file.write(bytes);
        written.push(fileName);
        imageRows.push({ id: newId(), productId: entry.id, fileName, sortOrder: sortOrder++ });
      }
    }
  } catch (error) {
    deleteProductImageFiles(written);
    throw error;
  }

  // Schritt 2: alles in einer Transaktion ersetzen (Reihenfolge wegen der Fremdschlüssel)
  try {
    db.transaction(() => {
      db.delete(listItem).run();
      db.delete(list).run();
      db.delete(recipe).run();
      db.delete(productImage).run();
      db.delete(product).run();
      db.delete(category).run();

      insertChunked(categoriesWithKeys(payload.categories), (chunk) =>
        db.insert(category).values(chunk).run()
      );
      insertChunked(payload.products, (chunk) =>
        db
          .insert(product)
          .values(
            chunk.map((entry) => ({
              id: entry.id,
              name: entry.name,
              categoryId: entry.categoryId,
              lastQuantity: entry.lastQuantity,
              lastUnit: entry.lastUnit,
              lastUsedAt: entry.lastUsedAt === null ? null : new Date(entry.lastUsedAt),
              createdAt: new Date(entry.createdAt),
            }))
          )
          .run()
      );
      insertChunked(imageRows, (chunk) => db.insert(productImage).values(chunk).run());
      insertChunked(payload.recipes, (chunk) =>
        db
          .insert(recipe)
          .values(chunk.map((entry) => ({ ...entry, createdAt: new Date(entry.createdAt) })))
          .run()
      );
      insertChunked(payload.lists, (chunk) =>
        db
          .insert(list)
          .values(
            chunk.map((entry) => ({
              id: entry.id,
              name: entry.name,
              color: entry.color,
              createdAt: new Date(entry.createdAt),
              lastUsedAt: new Date(entry.lastUsedAt),
              recipeId: entry.recipeId,
            }))
          )
          .run()
      );
      insertChunked(
        payload.lists.flatMap((entry) =>
          entry.items.map((item) => ({
            ...item,
            listId: entry.id,
            createdAt: new Date(item.createdAt),
          }))
        ),
        (chunk) => db.insert(listItem).values(chunk).run()
      );
    });
  } catch (error) {
    deleteProductImageFiles(written);
    throw error;
  }

  // „Sonstiges“ ist in jeder Sicherung, aber sicher ist sicher (eigene Transaktion, daher danach)
  seedDatabase(db);
  writeSetting(db, { key: "theme", value: payload.settings.theme });
  writeSetting(db, { key: "productsView", value: payload.settings.productsView });
  deleteProductImageFiles(previousFiles.map((row) => row.fileName));
  return payload.settings;
}
