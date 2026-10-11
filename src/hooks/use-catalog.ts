import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { getCatalog, getOtherCategoryName } from "@/lib/queries/products";

export function useCatalog() {
  return useQuery({ queryKey: queryKeys.catalog, queryFn: getCatalog });
}

/** Name von „Sonstiges“ – Kategorie eines neu anzulegenden Produkts (3d). */
export function useOtherCategoryName() {
  return useQuery({ queryKey: [...queryKeys.products, "other-category"], queryFn: getOtherCategoryName })
    .data;
}
