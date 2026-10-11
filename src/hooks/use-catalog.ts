import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { createProductInOther, getCatalog } from "@/lib/queries/products";

export function useCatalog() {
  return useQuery({ queryKey: queryKeys.catalog, queryFn: getCatalog });
}

export function useCreateProductInOther() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => createProductInOther(name),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.products }),
  });
}
