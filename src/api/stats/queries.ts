import { useQuery } from "@tanstack/react-query";
import { getStats } from "./fetcher";

export const statsKeys = {
  all: ["stats"] as const,
};

/** Dashboard totals, charts and lists. Pass refetchInterval (ms) to keep it updating. */
export function useStats(options: { refetchInterval?: number } = {}) {
  return useQuery({
    queryKey: statsKeys.all,
    queryFn: getStats,
    refetchInterval: options.refetchInterval,
  });
}
