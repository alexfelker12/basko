import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ListColor } from "@/lib/list-colors";
import { queryKeys } from "@/lib/query-keys";
import {
  createList,
  duplicateList,
  getListSummary,
  getLists,
  renameList,
  setListColor,
  touchList,
} from "@/lib/queries/lists";

export function useLists() {
  return useQuery({ queryKey: queryKeys.lists, queryFn: getLists });
}

export function useListSummary(id: string) {
  return useQuery({ queryKey: queryKeys.list(id), queryFn: () => getListSummary(id) });
}

/** Mutation auf lokale DB; danach alle Listen-Abfragen neu laden. */
function useListMutation<TVariables, TResult>(fn: (variables: TVariables) => TResult) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables: TVariables) => fn(variables),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.lists }),
  });
}

export function useCreateList() {
  return useListMutation(({ name, color }: { name: string; color: ListColor }) =>
    createList(name, color)
  );
}

export function useRenameList() {
  return useListMutation(({ id, name }: { id: string; name: string }) => renameList(id, name));
}

export function useSetListColor() {
  return useListMutation(({ id, color }: { id: string; color: ListColor }) =>
    setListColor(id, color)
  );
}

export function useDuplicateList() {
  return useListMutation((id: string) => duplicateList(id));
}

export function useTouchList() {
  return useListMutation((id: string) => touchList(id));
}
