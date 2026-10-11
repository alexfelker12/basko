/** TanStack-Query-Schlüssel. Alles unter `lists` wird nach Listen-Änderungen gemeinsam invalidiert. */
export const queryKeys = {
  lists: ["lists"] as const,
  list: (id: string) => ["lists", id] as const,
  listItems: (id: string) => ["lists", id, "items"] as const,
  catalog: ["products", "catalog"] as const,
  products: ["products"] as const,
};
