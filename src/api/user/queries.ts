import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { cleanParams } from "../params";
import { getCustomers, type CustomerListParams } from "./fetcher";

export const userKeys = {
  all: ["users"] as const,
  list: (params: CustomerListParams) => ["users", cleanParams(params)] as const,
};

/** A page of customer accounts with their order counts. */
export function useCustomers(params: CustomerListParams = {}) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => getCustomers(params),
    placeholderData: keepPreviousData,
  });
}
