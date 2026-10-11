import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import {
  createCategory,
  deleteCategory,
  getCategories,
  renameCategory,
  reorderCategories,
  type CategoryRow,
} from "@/lib/queries/categories";

/** Alle Kategorien in Ladenreihenfolge, „Sonstiges“ zuletzt. */
export function useCategories() {
  return useQuery({ queryKey: queryKeys.categories, queryFn: getCategories });
}

/** Kategorien bestimmen Sortierung und Überschriften aller Listen – beides neu laden. */
function useCategoryMutation<TVariables, TResult>(fn: (variables: TVariables) => TResult) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables: TVariables) => fn(variables),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
      queryClient.invalidateQueries({ queryKey: queryKeys.lists });
    },
  });
}

export function useCreateCategory() {
  return useCategoryMutation((name: string) => createCategory(name));
}

export function useRenameCategory() {
  return useCategoryMutation(({ id, name }: { id: string; name: string }) =>
    renameCategory(id, name)
  );
}

export function useDeleteCategory() {
  return useCategoryMutation((id: string) => deleteCategory(id));
}

/** Ziehen (5b) mit sofortiger Anzeige, damit die Zeile nach dem Loslassen nicht zurückspringt. */
export function useReorderCategories() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderedIds: string[]) => reorderCategories(orderedIds),
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.categories });
      queryClient.setQueryData<CategoryRow[]>(queryKeys.categories, (rows) => {
        if (!rows) return rows;
        const byId = new Map(rows.map((row) => [row.id, row]));
        const ordered = orderedIds.flatMap((id, index) => {
          const row = byId.get(id);
          return row ? [{ ...row, sortOrder: index }] : [];
        });
        return [...ordered, ...rows.filter((row) => row.isSystem)];
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
      queryClient.invalidateQueries({ queryKey: queryKeys.lists });
    },
  });
}
