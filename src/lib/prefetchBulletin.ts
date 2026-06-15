import type { QueryClient } from "@tanstack/react-query";
import { PRICE_BULLETIN_QUERY_KEY } from "../hooks/usePublicApi";
import { fetchPriceBulletin } from "./publicApi";

export function prefetchPriceBulletin(queryClient: QueryClient): void {
  void queryClient.prefetchQuery({
    queryKey: PRICE_BULLETIN_QUERY_KEY,
    queryFn: fetchPriceBulletin,
    staleTime: 300_000,
  });
}
