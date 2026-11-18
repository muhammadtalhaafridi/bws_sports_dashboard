import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { cleanParams } from "../params";
import { getProduct, getProducts, type ProductListParams } from "./fetcher";

export const productKeys = {
  all: ["products"] as const,
  list: (params: ProductListParams) => ["products", cleanParams(params)] as const,
  detail: (id: number | string) => ["product", String(id)] as const,
};

/** A page of products. The previous page stays on screen while the next one loads. */
export function useProducts(params: ProductListParams = {}) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => getProducts(params),
    placeholderData: keepPreviousData,
  });
}

/** One product, e.g. for the edit form. Does nothing until an id is given. */
export function useProduct(id: number | string | undefined) {
  return useQuery({
    queryKey: productKeys.detail(id ?? ""),
    queryFn: () => getProduct(id!),
    enabled: Boolean(id),
  });
}
