import { eq } from "drizzle-orm";
import { Directory, File, Paths } from "expo-file-system";

import { db } from "@/lib/db";
import { newId } from "@/lib/db/id";
import {
  category,
  list,
  listItem,
  product,
  productImage,
  type TransferDirection,
} from "@/lib/db/schema";
import { deleteProductImageFiles, PRODUCT_IMAGES_DIR } from "@/lib/images";
import { normalizeName } from "@/lib/names";
import { createList } from "@/lib/queries/lists";
import { getProductImages } from "@/lib/queries/products";
import { addTransferHistory } from "@/lib/queries/transfer-history";
import type { Unit } from "@/lib/units";

import type { DecodedTransfer, TransferItem } from "./format";

/*
 * Abgleich und Speichern einer empfangenen bzw. importierten Liste (6h–6j):
 * - Produkte werden über den Namen ohne Groß-/Kleinschreibung abgeglichen.
 * - Unbekannte Produkte werden vollständig mit Fotos angelegt, unbekannte Kategorien → „Sonstiges“.
 * - Konflikt = Produkt existiert, hat aber eine andere Kategorie oder andere Fotos (MD5).
 *   „Überschreiben“ ersetzt Kategorie und Fotos, „Behalten“ verwirft beides.
 * - Die Liste bekommt die Namensregel „(n)“, alle Einträge kommen offen an.
 */

export type ConflictResolution = "keep" | "overwrite";

export type ImportPreviewItem = {
  /** Normalisierter Produktname – Schlüssel für Konflikte und Entscheidungen. */
  key: string;
  name: string;
  quantity: number;
  unit: Unit;
  conflict: boolean;
};

export type ImportConflict = {
  key: string;
  productName: string;
  local: { categoryName: string; imageCount: number };
  incoming: { categoryName: string; imageCount: number };
};

export type ImportPreview = {
  listName: string;
  items: ImportPreviewItem[];
  conflicts: ImportConflict[];
};

type LocalCategory = { id: string; name: string; isSystem: boolean };
type LocalProduct = { id: string; name: string; categoryId: string };

/** Jedes Produkt nur einmal (der erste Eintrag zählt). */
function uniqueItems(items: TransferItem[]): TransferItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = normalizeName(item.product.name);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function loadContext() {
  const categories: LocalCategory[] = db
    .select({ id: category.id, name: category.name, isSystem: category.isSystem })
    .from(category)
    .all();
  const system = categories.find((row) => row.isSystem);
  if (!system) throw new Error("system category missing");

  const products = new Map<string, LocalProduct>();
  for (const row of db
    .select({ id: product.id, name: product.name, categoryId: product.categoryId })
    .from(product)
    .all()) {
    products.set(normalizeName(row.name), row);
  }

  /** Kategorie des Absenders hier: gleicher Name, sonst „Sonstiges“. */
  const resolveCategory = (name: string | null): LocalCategory => {
    if (name === null) return system;
    const normalized = normalizeName(name);
    return (
      categories.find((row) => !row.isSystem && normalizeName(row.name) === normalized) ?? system
    );
  };

  const categoryById = (id: string) => categories.find((row) => row.id === id) ?? system;

  return { products, resolveCategory, categoryById };
}

function localImageHashes(productId: string): string[] {
  return getProductImages(productId).map((fileName) => {
    const file = new File(Paths.document, PRODUCT_IMAGES_DIR, fileName);
    return (file.exists ? file.info({ md5: true }).md5 : null) ?? fileName;
  });
}

/** Gleiche Fotos unabhängig von der Reihenfolge. */
function sameHashes(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((hash, index) => hash === sortedB[index]);
}

/** Vorschau (6h) und Konflikte (6i) – schreibt nichts. */
export function analyzeImport({ payload }: DecodedTransfer): ImportPreview {
  const { products, resolveCategory, categoryById } = loadContext();
  const items: ImportPreviewItem[] = [];
  const conflicts: ImportConflict[] = [];

  for (const item of uniqueItems(payload.items)) {
    const key = normalizeName(item.product.name);
    const local = products.get(key);
    const incomingCategory = resolveCategory(item.product.category);
    let conflict = false;

    if (local) {
      const localHashes = localImageHashes(local.id);
      const incomingHashes = item.product.images.map((image) => image.hash);
      conflict =
        local.categoryId !== incomingCategory.id || !sameHashes(localHashes, incomingHashes);
      if (conflict) {
        conflicts.push({
          key,
          productName: local.name,
          local: {
            categoryName: categoryById(local.categoryId).name,
            imageCount: localHashes.length,
          },
          incoming: {
            categoryName: incomingCategory.name,
            imageCount: incomingHashes.length,
          },
        });
      }
    }

    items.push({
      key,
      name: local?.name ?? item.product.name,
      quantity: item.quantity,
      unit: item.unit,
      conflict,
    });
  }

  return { listName: payload.list.name, items, conflicts };
}

function imageExtension(fileName: string): string {
  const match = /\.[a-z0-9]{1,5}$/i.exec(fileName);
  return match ? match[0].toLowerCase() : ".jpg";
}

export type SaveImportSource = {
  direction: Extract<TransferDirection, "received" | "imported">;
  /** Gerätename des Absenders (nur Netzwerk). */
  peerName?: string;
};

/**
 * Speichert die Liste (6i „Liste speichern“ bzw. 6h „Übernehmen“). Fotos werden zuerst als
 * neue Dateien geschrieben, dann folgt eine Transaktion; ersetzte Fotodateien werden danach
 * gelöscht. Liefert die neue Liste.
 */
export function saveImport(
  { payload, images }: DecodedTransfer,
  resolutions: Record<string, ConflictResolution>,
  source: SaveImportSource
): { listId: string; listName: string } {
  const { products, resolveCategory } = loadContext();
  const directory = new Directory(Paths.document, PRODUCT_IMAGES_DIR);
  if (!directory.exists) directory.create({ intermediates: true, idempotent: true });

  const written: string[] = [];
  const replaced: string[] = [];

  /** Schreibt die Fotos eines Produkts als neue Dateien; fehlende Bytes werden übersprungen. */
  const writeImages = (item: TransferItem): string[] =>
    item.product.images.flatMap((ref) => {
      const bytes = images.get(ref.file);
      if (!bytes) return [];
      const fileName = `${newId()}${imageExtension(ref.file)}`;
      const file = new File(directory, fileName);
      file.create({ overwrite: true });
      file.write(bytes);
      written.push(fileName);
      return [fileName];
    });

  const insertImages = (productId: string, fileNames: string[]) => {
    if (fileNames.length === 0) return;
    db.insert(productImage)
      .values(
        fileNames.map((fileName, index) => ({
          id: newId(),
          productId,
          fileName,
          sortOrder: index,
        }))
      )
      .run();
  };

  // Schritt 1: welche Produkte neu sind bzw. überschrieben werden, und deren Fotos schreiben
  type Plan =
    | { kind: "new"; item: TransferItem; productId: string; fileNames: string[] }
    | { kind: "overwrite"; item: TransferItem; productId: string; fileNames: string[] }
    | { kind: "keep"; item: TransferItem; productId: string };

  let plans: Plan[];
  try {
    plans = uniqueItems(payload.items).map((item): Plan => {
      const key = normalizeName(item.product.name);
      const local = products.get(key);
      if (!local) return { kind: "new", item, productId: newId(), fileNames: writeImages(item) };
      if (resolutions[key] === "overwrite") {
        return { kind: "overwrite", item, productId: local.id, fileNames: writeImages(item) };
      }
      return { kind: "keep", item, productId: local.id };
    });
  } catch (error) {
    deleteProductImageFiles(written);
    throw error;
  }

  // Schritt 2: Datenbank in einer Transaktion
  let result: { listId: string; listName: string };
  try {
    result = db.transaction(() => {
      const now = new Date();
      for (const plan of plans) {
        if (plan.kind === "new") {
          db.insert(product)
            .values({
              id: plan.productId,
              name: plan.item.product.name,
              categoryId: resolveCategory(plan.item.product.category).id,
              createdAt: now,
            })
            .run();
          insertImages(plan.productId, plan.fileNames);
        } else if (plan.kind === "overwrite") {
          replaced.push(...getProductImages(plan.productId));
          db.update(product)
            .set({ categoryId: resolveCategory(plan.item.product.category).id })
            .where(eq(product.id, plan.productId))
            .run();
          db.delete(productImage).where(eq(productImage.productId, plan.productId)).run();
          insertImages(plan.productId, plan.fileNames);
        }
      }

      const listId = createList(payload.list.name, payload.list.color);
      const listName = getCreatedListName(listId);
      if (plans.length > 0) {
        db.insert(listItem)
          .values(
            plans.map((plan) => ({
              id: newId(),
              listId,
              productId: plan.productId,
              quantity: plan.item.quantity,
              unit: plan.item.unit,
              note: plan.item.note?.trim() || null,
              checked: false,
              createdAt: now,
            }))
          )
          .run();
      }

      return { listId, listName };
    });
  } catch (error) {
    deleteProductImageFiles(written);
    throw error;
  }

  // Erst nach der Transaktion: `addTransferHistory` öffnet eine eigene, und expo-sqlite kann
  // Transaktionen nicht verschachteln („Failed to run the query 'begin'“)
  addTransferHistory({ ...result, direction: source.direction, peerName: source.peerName });
  deleteProductImageFiles(replaced);
  return result;
}

/** Name nach Namensregel „(n)“, wie ihn `createList` vergeben hat. */
function getCreatedListName(listId: string): string {
  return db.select({ name: list.name }).from(list).where(eq(list.id, listId)).get()?.name ?? "";
}
