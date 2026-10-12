import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { localQuery } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";
import {
  createRecipeList,
  getSavedRecipe,
  getSavedRecipes,
  type RecipeListItem,
} from "@/lib/queries/recipes";
import { normalizeRecipeQuery, searchRecipes, type Recipe } from "@/lib/recipes/api";

/**
 * Rezeptsuche (7b): erst beim Bestätigen (leerer Begriff = keine Anfrage). Die Treffer bleiben pro
 * Suchbegriff für die ganze Sitzung im Cache – das schont das Kontingent des Free Tiers und
 * liefert die Daten für die Details (7d), die es als eigenen Endpunkt nicht gibt.
 */
export function useRecipeSearch(query: string) {
  const normalized = normalizeRecipeQuery(query);
  return useQuery({
    queryKey: queryKeys.recipeSearch(normalized),
    queryFn: ({ signal }) => searchRecipes(normalized, signal),
    enabled: normalized.length > 0,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  });
}

/** Gespeicherte Rezepte (7a): Rezepte mit mindestens einer sichtbaren Liste. */
export function useSavedRecipes() {
  return useQuery(localQuery(queryKeys.savedRecipes, getSavedRecipes));
}

/** Ein gespeichertes Rezept für die Details (7d) – ohne API-Aufruf. */
export function useSavedRecipe(id: string) {
  return useQuery(localQuery(queryKeys.savedRecipe(id), () => getSavedRecipe(id)));
}

/**
 * Einkaufsliste aus einem Rezept anlegen (7e); das Rezept wird mitgespeichert (bzw. ein schon
 * gespeichertes wiederverwendet). Liefert die ID der neuen Liste.
 */
export function useCreateRecipeList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      items,
      recipe,
    }: {
      name: string;
      items: RecipeListItem[];
      recipe: Recipe & { id?: string };
    }) => createRecipeList(name, items, recipe),
    onSettled: () => {
      // Neue Liste und ggf. neue Produkte in „Sonstiges“
      queryClient.invalidateQueries({ queryKey: queryKeys.lists });
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
    },
  });
}
