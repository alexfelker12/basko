import { and, desc, eq, isNull, max } from "drizzle-orm";

import { db } from "@/lib/db";
import { newId } from "@/lib/db/id";
import { list, product, recipe, type RecipeRecord } from "@/lib/db/schema";
import { RECIPE_LIST_COLOR } from "@/lib/list-colors";
import { normalizeName } from "@/lib/names";
import type { Recipe } from "@/lib/recipes/api";
import type { Amount } from "@/lib/recipes/ingredients";

import { getSystemCategoryId } from "./categories";
import { insertListItem } from "./list-items";
import { createList } from "./lists";

/** Rezept aus der Datenbank (gespeichert mit einer Liste aus 7e oder per Transfer). */
export type SavedRecipe = Recipe & { id: string };

function toSavedRecipe(row: RecipeRecord): SavedRecipe {
  return {
    id: row.id,
    title: row.title,
    servings: row.servings,
    ingredients: row.ingredients,
    instructions: row.instructions,
    nutrition: { calories: row.calories, protein: row.protein, carbs: row.carbs, fat: row.fat },
  };
}

/**
 * Gespeicherte Rezepte für den Rezepte-Tab (7a): nur solche mit mindestens einer sichtbaren Liste,
 * zuletzt benutzte Liste zuerst.
 */
export function getSavedRecipes(): SavedRecipe[] {
  return db
    .select({ recipe, lastUsedAt: max(list.lastUsedAt) })
    .from(recipe)
    .innerJoin(list, and(eq(list.recipeId, recipe.id), isNull(list.deletedAt)))
    .groupBy(recipe.id)
    .orderBy(desc(max(list.lastUsedAt)))
    .all()
    .map((row) => toSavedRecipe(row.recipe));
}

export function getSavedRecipe(id: string): SavedRecipe | null {
  const row = db.select().from(recipe).where(eq(recipe.id, id)).get();
  return row ? toSavedRecipe(row) : null;
}

/** Rezept einer Liste (Transfer, `.basko`), sonst `null`. */
export function getListRecipe(listId: string): Recipe | null {
  const row = db
    .select({ recipe })
    .from(list)
    .innerJoin(recipe, eq(recipe.id, list.recipeId))
    .where(eq(list.id, listId))
    .get();
  return row ? toSavedRecipe(row.recipe) : null;
}

function sameContent(row: RecipeRecord, data: Recipe): boolean {
  return (
    row.servings === data.servings &&
    JSON.stringify(row.ingredients) === JSON.stringify(data.ingredients) &&
    JSON.stringify(row.instructions) === JSON.stringify(data.instructions)
  );
}

/**
 * ID eines gespeicherten Rezepts: das übergebene (`id`), ein inhaltsgleiches (gleicher Titel,
 * gleiche Zutaten und Schritte) oder ein neu angelegtes. So entsteht pro Rezept nur ein Eintrag,
 * auch wenn mehrere Listen daraus erstellt oder empfangen werden. Ohne eigene Transaktion.
 */
export function findOrCreateRecipe(data: Recipe & { id?: string }): string {
  if (data.id && db.select({ id: recipe.id }).from(recipe).where(eq(recipe.id, data.id)).get()) {
    return data.id;
  }
  const existing = db
    .select()
    .from(recipe)
    .where(eq(recipe.title, data.title))
    .all()
    .find((row) => sameContent(row, data));
  if (existing) return existing.id;

  const id = newId();
  db.insert(recipe)
    .values({
      id,
      title: data.title,
      servings: data.servings,
      ingredients: data.ingredients.map(({ name, quantity, unit }) => ({ name, quantity, unit })),
      instructions: data.instructions,
      calories: data.nutrition.calories,
      protein: data.nutrition.protein,
      carbs: data.nutrition.carbs,
      fat: data.nutrition.fat,
      createdAt: new Date(),
    })
    .run();
  return id;
}

export type RecipeListItem = {
  name: string;
  amount: Amount;
  /** Originalangabe(n) aus dem Rezept. */
  note: string | null;
};

/**
 * Einkaufsliste aus einem Rezept (7e): neue Liste in Lila (Namensregel „(n)“), die auf das
 * gespeicherte Rezept zeigt, je Zutat ein Eintrag. Passt der Name zu einem Produkt (ohne
 * Groß-/Kleinschreibung), wird es verwendet, sonst entsteht ein neues Produkt in „Sonstiges“ ohne
 * Fotos. Die Namen sind schon zusammengefasst (keine Dubletten). Alles in einer Transaktion;
 * liefert die ID der Liste.
 */
export function createRecipeList(
  name: string,
  items: RecipeListItem[],
  source: Recipe & { id?: string }
): string {
  return db.transaction(() => {
    const otherCategoryId = getSystemCategoryId();
    if (!otherCategoryId) throw new Error("Systemkategorie „Sonstiges“ fehlt");

    const productIds = new Map(
      db
        .select({ id: product.id, name: product.name })
        .from(product)
        .all()
        .map((row) => [normalizeName(row.name), row.id])
    );

    const listId = createList(name, RECIPE_LIST_COLOR, findOrCreateRecipe(source));
    const now = new Date();
    // Ein Produkt steht höchstens einmal in einer Liste
    const added = new Set<string>();

    for (const item of items) {
      const key = normalizeName(item.name);
      if (!key) continue;

      let productId = productIds.get(key);
      if (!productId) {
        productId = newId();
        db.insert(product)
          .values({
            id: productId,
            name: item.name.trim(),
            categoryId: otherCategoryId,
            createdAt: now,
          })
          .run();
        productIds.set(key, productId);
      }

      if (added.has(productId)) continue;
      added.add(productId);
      insertListItem(listId, productId, {
        quantity: item.amount.quantity,
        unit: item.amount.unit,
        note: item.note,
      });
    }
    return listId;
  });
}
