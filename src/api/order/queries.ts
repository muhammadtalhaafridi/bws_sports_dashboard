import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { cleanParams } from "../params";
import { getOrder, getOrders, type OrderListParams } from "./fetcher";

export const orderKeys = {
  all: ["orders"] as const,
  list: (params: OrderListParams) => ["orders", cleanParams(params)] as const,
  detail: (id: number | string) => ["order", String(id)] as const,
};

/** A page of orders, optionally filtered by status or search text. */
export function useOrders(params: OrderListParams = {}) {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => getOrders(params),
    placeholderData: keepPreviousData,
  });
}

/** One order with its items and customer. */
export function useOrder(id: number | string | undefined) {
  return useQuery({
    queryKey: orderKeys.detail(id ?? ""),
    queryFn: () => getOrder(id!),
    enabled: Boolean(id),
  });
}
