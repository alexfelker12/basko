import { db } from "@/lib/db";
import { newId } from "@/lib/db/id";
import { product } from "@/lib/db/schema";
import { RECIPE_LIST_COLOR } from "@/lib/list-colors";
import { normalizeName } from "@/lib/names";
import type { Amount } from "@/lib/recipes/ingredients";

import { getSystemCategoryId } from "./categories";
import { insertListItem } from "./list-items";
import { createList } from "./lists";

export type RecipeListItem = {
  name: string;
  amount: Amount;
  /** Originalangabe(n) aus dem Rezept. */
  note: string | null;
};

/**
 * Einkaufsliste aus einem Rezept (7e): neue Liste in Lila (Namensregel „(n)“), je Zutat ein
 * Eintrag. Passt der Name zu einem Produkt (ohne Groß-/Kleinschreibung), wird es verwendet,
 * sonst entsteht ein neues Produkt in „Sonstiges“ ohne Fotos. Die Namen sind schon
 * zusammengefasst (keine Dubletten). Alles in einer Transaktion; liefert die ID der Liste.
 */
export function createRecipeList(name: string, items: RecipeListItem[]): string {
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

    const listId = createList(name, RECIPE_LIST_COLOR);
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
