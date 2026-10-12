import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

/** Zutat wie von der Rezept-API geliefert (Name, Menge, Einheit – Englisch, unverändert). */
export type RecipeIngredientData = {
  name: string;
  quantity: number | null;
  unit: string | null;
};

/**
 * Gespeichertes Rezept (Schnappschuss aus der API Ninjas Recipe API), auf das Listen aus
 * „Einkaufsliste erstellen“ (7e) zeigen. Es lebt mit seinen Listen: Zeigt keine Liste mehr darauf,
 * wird es gelöscht (`deleteOrphanRecipes`). Nährwerte gelten pro Rezept.
 */
export const recipe = sqliteTable("recipe", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  /** Wie geliefert, z. B. „6 servings“. */
  servings: text("servings"),
  ingredients: text("ingredients", { mode: "json" }).$type<RecipeIngredientData[]>().notNull(),
  instructions: text("instructions", { mode: "json" }).$type<string[]>().notNull(),
  calories: real("calories"),
  protein: real("protein"),
  carbs: real("carbs"),
  fat: real("fat"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type RecipeRecord = typeof recipe.$inferSelect;
export type NewRecipeRecord = typeof recipe.$inferInsert;
