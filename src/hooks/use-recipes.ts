import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { createRecipeList, type RecipeListItem } from "@/lib/queries/recipes";
import { normalizeRecipeQuery, searchRecipes } from "@/lib/recipes/api";

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

/** Einkaufsliste aus einem Rezept anlegen (7e); liefert die ID der neuen Liste. */
export function useCreateRecipeList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, items }: { name: string; items: RecipeListItem[] }) =>
      createRecipeList(name, items),
    onSettled: () => {
      // Neue Liste und ggf. neue Produkte in „Sonstiges“
      queryClient.invalidateQueries({ queryKey: queryKeys.lists });
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
    },
  });
}
