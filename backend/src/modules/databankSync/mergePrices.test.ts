import assert from "node:assert/strict";
import test from "node:test";
import { mergeByPriority } from "./mergePrices.js";
import type { MappedPriceEntry } from "./types.js";

function entry(
  slug: string,
  avg: string,
  date = "2026-06-15",
  extras: Partial<MappedPriceEntry> = {},
): MappedPriceEntry {
  return {
    productSlug: slug,
    productName: slug,
    category: "TEST",
    unit: "₺/kg",
    entryDate: date,
    lowPrice: avg,
    highPrice: avg,
    avgPrice: avg,
    ...extras,
  };
}

test("mergeByPriority lets tescil win when priority is tescil,home", () => {
  const home = [entry("armut-hts-satis", "77.49")];
  const tescil = [
    entry("armut-hts-satis", "70", "2026-06-15", {
      volume: "1200",
      volumeUnit: "KG",
      transactionCount: 1,
    }),
  ];
  const merged = mergeByPriority(home, tescil, ["tescil", "home"]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0]?.avgPrice, "70");
  assert.equal(merged[0]?.volume, "1200");
});

test("mergeByPriority lets home win when priority is home,tescil", () => {
  const home = [entry("armut-hts-satis", "77.49")];
  const tescil = [entry("armut-hts-satis", "70")];
  const merged = mergeByPriority(home, tescil, ["home", "tescil"]);
  assert.equal(merged[0]?.avgPrice, "77.49");
});
