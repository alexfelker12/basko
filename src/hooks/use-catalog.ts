import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { localQuery } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";
import {
  createProduct,
  deleteProduct,
  getCatalog,
  getProductImages,
  getProductListCount,
  updateProduct,
  type ProductValues,
} from "@/lib/queries/products";

export function useCatalog() {
  return useQuery(localQuery(queryKeys.catalog, getCatalog));
}

/** Fotos eines Produkts (Dateinamen in Reihenfolge); `null` = nichts laden. */
export function useProductImages(productId: string | null) {
  return useQuery({
    ...localQuery(queryKeys.productImages(productId ?? ""), () =>
      productId === null ? [] : getProductImages(productId)
    ),
    enabled: productId !== null,
  });
}

/** In wie vielen Listen das Produkt steht (Löschen-Dialog 4f); `null` = nichts laden. */
export function useProductListCount(productId: string | null) {
  return useQuery({
    ...localQuery(queryKeys.productListCount(productId ?? ""), () =>
      productId === null ? 0 : getProductListCount(productId)
    ),
    enabled: productId !== null,
  });
}

/** Mutation am Katalog; Produkte erscheinen auch in Listen (Name, Kategorie, Vorschaubild). */
function useCatalogMutation<TVariables, TResult>(fn: (variables: TVariables) => TResult) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables: TVariables) => fn(variables),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
      queryClient.invalidateQueries({ queryKey: queryKeys.lists });
    },
  });
}

export function useCreateProduct() {
  return useCatalogMutation((values: ProductValues) => createProduct(values));
}

export function useUpdateProduct() {
  return useCatalogMutation(({ id, values }: { id: string; values: ProductValues }) =>
    updateProduct(id, values)
  );
}

export function useDeleteProduct() {
  return useCatalogMutation((id: string) => deleteProduct(id));
}
