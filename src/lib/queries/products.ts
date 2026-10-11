import { asc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { newId } from "@/lib/db/id";
import { category, PRODUCT_NAME_MAX, product } from "@/lib/db/schema";
import type { Unit } from "@/lib/units";

export type CatalogProduct = {
  id: string;
  name: string;
  categoryName: string;
  lastQuantity: number | null;
  lastUnit: Unit | null;
  lastUsedAt: Date | null;
};

const catalogFields = {
  id: product.id,
  name: product.name,
  categoryName: category.name,
  lastQuantity: product.lastQuantity,
  lastUnit: product.lastUnit,
  lastUsedAt: product.lastUsedAt,
};

/** Gesamter Katalog für die Suche (3c); gefiltert und gerankt wird in `lib/product-search`. */
export function getCatalog(): CatalogProduct[] {
  return db
    .select(catalogFields)
    .from(product)
    .innerJoin(category, eq(category.id, product.categoryId))
    .orderBy(asc(product.name))
    .all();
}

function getCatalogProduct(id: string): CatalogProduct | null {
  return (
    db
      .select(catalogFields)
      .from(product)
      .innerJoin(category, eq(category.id, product.categoryId))
      .where(eq(product.id, id))
      .get() ?? null
  );
}

/** Name der Systemkategorie „Sonstiges“ (Anzeige beim Neuanlegen, 3d). */
export function getOtherCategoryName(): string | null {
  return (
    db
      .select({ name: category.name })
      .from(category)
      .where(eq(category.isSystem, true))
      .get()?.name ?? null
  );
}

/**
 * „‚{Suchtext}‘ neu anlegen“ (3d) – in Phase 2 direkt in „Sonstiges“, ohne Fotos.
 * Gibt es den Namen schon (ohne Beachtung der Groß-/Kleinschreibung), wird das vorhandene Produkt geliefert.
 * Ohne eigene Transaktion – Aufrufer (`addNewProductToList`) klammert.
 */
export function insertProductInOther(name: string): CatalogProduct | null {
  const trimmed = name.trim().slice(0, PRODUCT_NAME_MAX);
  if (!trimmed) return null;

  const lower = trimmed.toLocaleLowerCase("de");
  const existing = db
    .select({ id: product.id, name: product.name })
    .from(product)
    .all()
    .find((row) => row.name.toLocaleLowerCase("de") === lower);
  if (existing) return getCatalogProduct(existing.id);

  const other = db
    .select({ id: category.id })
    .from(category)
    .where(eq(category.isSystem, true))
    .get();
  if (!other) return null;

  const id = newId();
  db.insert(product)
    .values({ id, name: trimmed, categoryId: other.id, createdAt: new Date() })
    .run();
  return getCatalogProduct(id);
}
