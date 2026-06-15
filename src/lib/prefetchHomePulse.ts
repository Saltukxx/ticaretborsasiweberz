import type { QueryClient } from "@tanstack/react-query";
import {
  PRICE_BULLETIN_QUERY_KEY,
  PUBLIC_CURRENCY_RATES_KEY,
  PUBLIC_CURRENT_PRICES_KEY,
  PUBLIC_MARKET_TICKER_KEY,
  PUBLIC_NEWS_LIST_KEY,
} from "../hooks/usePublicApi";
import {
  fetchCurrencyRates,
  fetchCurrentPrices,
  fetchMarketTicker,
  fetchNewsList,
  fetchPriceBulletin,
  fetchStats,
} from "./publicApi";

/** Shared limit so homepage news consumers hit one cache entry. */
export const HOME_PULSE_NEWS_LIMIT = 20;

/** Warm cache for above-the-fold pulse strips before child sections mount. */
export function prefetchHomePulseQueries(queryClient: QueryClient): void {
  void queryClient.prefetchQuery({
    queryKey: PUBLIC_NEWS_LIST_KEY(HOME_PULSE_NEWS_LIMIT),
    queryFn: () => fetchNewsList(HOME_PULSE_NEWS_LIMIT, 0),
    staleTime: 120_000,
  });
  void queryClient.prefetchQuery({
    queryKey: PUBLIC_CURRENCY_RATES_KEY,
    queryFn: fetchCurrencyRates,
    staleTime: 30_000,
  });
  void queryClient.prefetchQuery({
    queryKey: PUBLIC_MARKET_TICKER_KEY,
    queryFn: fetchMarketTicker,
    staleTime: 60_000,
  });
  void queryClient.prefetchQuery({
    queryKey: PUBLIC_CURRENT_PRICES_KEY,
    queryFn: fetchCurrentPrices,
    staleTime: 60_000,
  });
  void queryClient.prefetchQuery({
    queryKey: PRICE_BULLETIN_QUERY_KEY,
    queryFn: fetchPriceBulletin,
    staleTime: 300_000,
  });
  void queryClient.prefetchQuery({
    queryKey: ["public", "stats"],
    queryFn: () => fetchStats(),
    staleTime: 300_000,
  });
}
