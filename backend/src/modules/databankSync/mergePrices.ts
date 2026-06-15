import type { MappedPriceEntry } from "./types.js";

/** Preserve tescil volume/transaction fields when a price-only source merges in. */
export function mergePriceEntry(
  existing: MappedPriceEntry | undefined,
  incoming: MappedPriceEntry,
): MappedPriceEntry {
  if (!existing) return incoming;
  return {
    ...incoming,
    volume: incoming.volume ?? existing.volume ?? null,
    volumeUnit: incoming.volumeUnit ?? existing.volumeUnit ?? null,
    transactionAmount:
      incoming.transactionAmount ?? existing.transactionAmount ?? null,
    transactionCount:
      incoming.transactionCount ?? existing.transactionCount ?? null,
  };
}

/**
 * Merge home + tescil rows. First entry in `priority` wins on price conflicts
 * (highest priority is applied last).
 */
export function mergeByPriority(
  home: MappedPriceEntry[],
  tescil: MappedPriceEntry[],
  priority: ("tescil" | "home")[],
): MappedPriceEntry[] {
  const map = new Map<string, MappedPriceEntry>();
  const order = (priority.length ? priority : ["tescil", "home"]).slice().reverse();

  const apply = (list: MappedPriceEntry[]) => {
    for (const e of list) {
      const key = `${e.productSlug}|${e.entryDate}`;
      map.set(key, mergePriceEntry(map.get(key), e));
    }
  };

  for (const src of order) {
    if (src === "home") apply(home);
    if (src === "tescil") apply(tescil);
  }
  return [...map.values()];
}
