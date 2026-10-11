import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import {
  addListItem,
  getListItems,
  resetListChecks,
  setListItemChecked,
  updateListItem,
  type ItemValues,
  type ListItemRow,
} from "@/lib/queries/list-items";

export function useListItems(listId: string) {
  return useQuery({ queryKey: queryKeys.listItems(listId), queryFn: () => getListItems(listId) });
}

function useItemMutation<TVariables, TResult>(fn: (variables: TVariables) => TResult) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables: TVariables) => fn(variables),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lists });
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
    },
  });
}

export function useAddListItem() {
  return useItemMutation(
    ({ listId, productId, values }: { listId: string; productId: string; values: ItemValues }) =>
      addListItem(listId, productId, values)
  );
}

export function useUpdateListItem() {
  return useItemMutation(({ id, values }: { id: string; values: Partial<ItemValues> }) =>
    updateListItem(id, values)
  );
}

export function useResetListChecks() {
  return useItemMutation((listId: string) => resetListChecks(listId));
}

/** Abhaken mit sofortiger Anzeige (optimistisch), damit die Zeile ohne Verzögerung gleitet. */
export function useSetItemChecked(listId: string) {
  const queryClient = useQueryClient();
  const key = queryKeys.listItems(listId);

  return useMutation({
    mutationFn: async ({ id, checked }: { id: string; checked: boolean }) =>
      setListItemChecked(id, checked),
    onMutate: async ({ id, checked }) => {
      await queryClient.cancelQueries({ queryKey: key });
      queryClient.setQueryData<ListItemRow[]>(key, (items) =>
        items?.map((item) => (item.id === id ? { ...item, checked } : item))
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.lists }),
  });
}
