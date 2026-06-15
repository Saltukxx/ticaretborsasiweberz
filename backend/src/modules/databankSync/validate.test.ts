import assert from "node:assert/strict";
import test from "node:test";
import { filterValidEntries, validateMappedEntry } from "./validate.js";
import type { MappedPriceEntry } from "./types.js";

function sample(overrides: Partial<MappedPriceEntry> = {}): MappedPriceEntry {
  return {
    productSlug: "bugday-hts-satis",
    productName: "BUĞDAY · HTS · Satış",
    category: "HUBUBATLAR",
    unit: "₺/kg",
    entryDate: "2026-05-21",
    lowPrice: "10",
    highPrice: "14",
    avgPrice: "12",
    ...overrides,
  };
}

test("validateMappedEntry rejects low > high", () => {
  assert.equal(
    validateMappedEntry(sample({ lowPrice: "20", highPrice: "10", avgPrice: "15" })),
    "low_exceeds_high",
  );
});

test("validateMappedEntry rejects avg outside range", () => {
  assert.equal(
    validateMappedEntry(sample({ lowPrice: "10", highPrice: "12", avgPrice: "50" })),
    "avg_outside_range",
  );
});

test("filterValidEntries keeps only valid rows", () => {
  const { valid, rejected } = filterValidEntries([
    sample(),
    sample({ avgPrice: "0" }),
  ]);
  assert.equal(valid.length, 1);
  assert.equal(rejected.length, 1);
  assert.equal(rejected[0]!.reason, "non_positive_price");
});
