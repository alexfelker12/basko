import { collator } from "@/lib/i18n";
import type { CatalogProduct } from "@/lib/queries/products";
import { matchText, type HighlightPart } from "@/lib/search";

/** Ohne Eingabe: Schnellauswahl der 10 zuletzt benutzten Produkte (3c). */
const RECENT_LIMIT = 10;
/** Mit Eingabe: bis zu 3 zuletzt benutzte Treffer oben (3c). */
const RECENT_MATCHES_LIMIT = 3;

export type ProductSearchResult = {
  product: CatalogProduct;
  parts: HighlightPart[];
  /** Hinweis „zuletzt genutzt“. */
  recent: boolean;
  /** Eintrags-ID, wenn das Produkt schon in der Liste steht (Hinweis „in Liste“). */
  listItemId: string | null;
};

function byLastUsed(a: CatalogProduct, b: CatalogProduct) {
  return (b.lastUsedAt?.getTime() ?? 0) - (a.lastUsedAt?.getTime() ?? 0);
}

export function searchProducts(
  catalog: CatalogProduct[],
  query: string,
  itemIdsByProduct: Map<string, string>
): ProductSearchResult[] {
  const toResult = (product: CatalogProduct, parts: HighlightPart[], recent: boolean) => ({
    product,
    parts,
    recent,
    listItemId: itemIdsByProduct.get(product.id) ?? null,
  });

  if (!query.trim()) {
    return catalog
      .filter((product) => product.lastUsedAt)
      .sort(byLastUsed)
      .slice(0, RECENT_LIMIT)
      .map((product) => toResult(product, [{ text: product.name, match: false }], false));
  }

  const matches = catalog.flatMap((product) => {
    const parts = matchText(product.name, query);
    return parts ? [{ product, parts }] : [];
  });

  const recentIds = new Set(
    matches
      .filter(({ product }) => product.lastUsedAt)
      .sort((a, b) => byLastUsed(a.product, b.product))
      .slice(0, RECENT_MATCHES_LIMIT)
      .map(({ product }) => product.id)
  );

  const recent = matches
    .filter(({ product }) => recentIds.has(product.id))
    .sort((a, b) => byLastUsed(a.product, b.product));
  const rest = matches
    .filter(({ product }) => !recentIds.has(product.id))
    .sort((a, b) => collator.compare(a.product.name, b.product.name));

  return [
    ...recent.map(({ product, parts }) => toResult(product, parts, true)),
    ...rest.map(({ product, parts }) => toResult(product, parts, false)),
  ];
}

export type CatalogMatch = {
  product: CatalogProduct;
  parts: HighlightPart[];
};

/**
 * Produkte-Tab (4a/4b): Kategorie-Filter und Suche nach denselben Regeln wie im Such-Sheet
 * (Teilwort, ohne Groß-/Kleinschreibung, umlauttolerant, Treffer markiert), alphabetisch.
 */
export function filterCatalog(
  catalog: CatalogProduct[],
  query: string,
  categoryId: string | null
): CatalogMatch[] {
  return catalog
    .filter((product) => categoryId === null || product.categoryId === categoryId)
    .flatMap((product) => {
      const parts = matchText(product.name, query);
      return parts ? [{ product, parts }] : [];
    })
    .sort((a, b) => collator.compare(a.product.name, b.product.name));
}
