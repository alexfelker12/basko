/**
 * TanStack-Query-Schlüssel. Alles unter `lists` wird nach Listen-Änderungen gemeinsam invalidiert,
 * alles unter `products` nach Änderungen am Katalog (Produkte, Fotos, Kategorien).
 */
export const queryKeys = {
  lists: ["lists"] as const,
  list: (id: string) => ["lists", id] as const,
  listItems: (id: string) => ["lists", id, "items"] as const,
  products: ["products"] as const,
  catalog: ["products", "catalog"] as const,
  productImages: (id: string) => ["products", "images", id] as const,
  productListCount: (id: string) => ["products", "list-count", id] as const,
  categories: ["products", "categories"] as const,
};
