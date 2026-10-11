import { and, asc, count, countDistinct, eq, isNull, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { newId } from "@/lib/db/id";
import {
  category,
  list,
  listItem,
  PRODUCT_IMAGES_MAX,
  PRODUCT_NAME_MAX,
  product,
  productImage,
} from "@/lib/db/schema";
import { deleteProductImageFiles, storePhotoDrafts, type PhotoDraft } from "@/lib/images";
import { isNameTaken } from "@/lib/names";
import type { Unit } from "@/lib/units";

export type CatalogProduct = {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  lastQuantity: number | null;
  lastUnit: Unit | null;
  lastUsedAt: Date | null;
  /** Erstes Foto (Vorschaubild), sonst `null`. */
  thumbnailFileName: string | null;
  imageCount: number;
};

/** Erstes Foto eines Produkts – Unterabfrage für Katalog und Listeneinträge. */
export const firstProductImage = db
  .select({ fileName: productImage.fileName })
  .from(productImage)
  .where(eq(productImage.productId, product.id))
  .orderBy(asc(productImage.sortOrder))
  .limit(1);

const imageCount = db
  .select({ value: count() })
  .from(productImage)
  .where(eq(productImage.productId, product.id));

const catalogFields = {
  id: product.id,
  name: product.name,
  categoryId: product.categoryId,
  categoryName: category.name,
  lastQuantity: product.lastQuantity,
  lastUnit: product.lastUnit,
  lastUsedAt: product.lastUsedAt,
  thumbnailFileName: sql<string | null>`(${firstProductImage})`,
  imageCount: sql<number>`(${imageCount})`,
};

/**
 * Gesamter Katalog, alphabetisch – für den Produkte-Tab (4a/4b) und die Suche (3c);
 * gefiltert und gerankt wird in `lib/product-search`.
 */
export function getCatalog(): CatalogProduct[] {
  return db
    .select(catalogFields)
    .from(product)
    .innerJoin(category, eq(category.id, product.categoryId))
    .orderBy(asc(product.name))
    .all();
}

export function getCatalogProduct(id: string): CatalogProduct | null {
  return (
    db
      .select(catalogFields)
      .from(product)
      .innerJoin(category, eq(category.id, product.categoryId))
      .where(eq(product.id, id))
      .get() ?? null
  );
}

/** Dateinamen aller Fotos eines Produkts in Reihenfolge (Vollbildansicht 4c, Bearbeiten 4d). */
export function getProductImages(productId: string): string[] {
  return db
    .select({ fileName: productImage.fileName })
    .from(productImage)
    .where(eq(productImage.productId, productId))
    .orderBy(asc(productImage.sortOrder))
    .all()
    .map((row) => row.fileName);
}

/** In wie vielen (sichtbaren) Listen das Produkt steht – Warnung beim Löschen (4f). */
export function getProductListCount(productId: string): number {
  const [{ value }] = db
    .select({ value: countDistinct(listItem.listId) })
    .from(listItem)
    .innerJoin(list, eq(list.id, listItem.listId))
    .where(
      and(eq(listItem.productId, productId), isNull(listItem.deletedAt), isNull(list.deletedAt))
    )
    .all();
  return value;
}

export type ProductValues = {
  name: string;
  categoryId: string;
  photos: PhotoDraft[];
};

function productNames(excludeId?: string): string[] {
  return db
    .select({ id: product.id, name: product.name })
    .from(product)
    .all()
    .filter((row) => row.id !== excludeId)
    .map((row) => row.name);
}

/** Fotos in Reihenfolge ersetzen (das erste ist das Vorschaubild). Ohne eigene Transaktion. */
function replaceProductImages(productId: string, fileNames: string[]) {
  db.delete(productImage).where(eq(productImage.productId, productId)).run();
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
}

function validValues(values: ProductValues, excludeId?: string) {
  const name = values.name.trim();
  if (!name || name.length > PRODUCT_NAME_MAX) return null;
  if (isNameTaken(name, productNames(excludeId))) return null;
  return { name, photos: values.photos.slice(0, PRODUCT_IMAGES_MAX) };
}

/**
 * Neues Produkt (4d). Liefert das angelegte Produkt oder `null`, wenn der Name leer oder schon
 * vergeben ist (ohne Beachtung der Groß-/Kleinschreibung).
 */
export function createProduct(values: ProductValues): CatalogProduct | null {
  const valid = validValues(values);
  if (!valid) return null;

  const fileNames = storePhotoDrafts(valid.photos);
  const id = newId();
  try {
    db.transaction(() => {
      db.insert(product)
        .values({ id, name: valid.name, categoryId: values.categoryId, createdAt: new Date() })
        .run();
      replaceProductImages(id, fileNames);
    });
  } catch (error) {
    deleteProductImageFiles(fileNames);
    throw error;
  }
  return getCatalogProduct(id);
}

/**
 * Produkt bearbeiten (4d mit „Speichern“). Eine geänderte Kategorie sortiert das Produkt in allen
 * Listen sofort um (die Listen lesen die Kategorie über das Produkt). Entfernte Fotos werden gelöscht.
 */
export function updateProduct(id: string, values: ProductValues): boolean {
  const valid = validValues(values, id);
  if (!valid) return false;

  const previous = getProductImages(id);
  const fileNames = storePhotoDrafts(valid.photos);
  db.transaction(() => {
    db.update(product)
      .set({ name: valid.name, categoryId: values.categoryId })
      .where(eq(product.id, id))
      .run();
    replaceProductImages(id, fileNames);
  });

  const kept = new Set(fileNames);
  deleteProductImageFiles(previous.filter((fileName) => !kept.has(fileName)));
  return true;
}

/** Löschen (4f): endgültig, inkl. aller Listeneinträge (Cascade) und Fotos. */
export function deleteProduct(id: string) {
  const fileNames = getProductImages(id);
  db.delete(product).where(eq(product.id, id)).run();
  deleteProductImageFiles(fileNames);
}
