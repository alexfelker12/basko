/**
 * TanStack-Query-Schlüssel. Alles unter `lists` wird nach Listen-Änderungen gemeinsam invalidiert,
 * alles unter `products` nach Änderungen am Katalog (Produkte, Fotos, Kategorien).
 */
export const queryKeys = {
  lists: ["lists"] as const,
  list: (id: string) => ["lists", id] as const,
  listItems: (id: string) => ["lists", id, "items"] as const,
  /** Gespeicherte Rezepte (7a) hängen an Listen – unter `lists`, damit Löschen/Rückgängig sie mitnimmt. */
  savedRecipes: ["lists", "saved-recipes"] as const,
  savedRecipe: (id: string) => ["lists", "saved-recipes", id] as const,
  products: ["products"] as const,
  catalog: ["products", "catalog"] as const,
  productImages: (id: string) => ["products", "images", id] as const,
  productListCount: (id: string) => ["products", "list-count", id] as const,
  categories: ["products", "categories"] as const,
  transferHistory: ["transfer-history"] as const,
  /** Rezeptsuche (7b): Ergebnisse pro Suchbegriff, bleiben für die Sitzung im Cache. */
  recipeSearch: (query: string) => ["recipes", query] as const,
};
