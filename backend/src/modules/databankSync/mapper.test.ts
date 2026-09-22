import assert from "node:assert/strict";
import test from "node:test";
import { toBulkRows } from "./mapper.js";
import type { MappedPriceEntry } from "./types.js";

function sampleEntry(overrides: Partial<MappedPriceEntry> = {}): MappedPriceEntry {
  return {
    productSlug: "bugday-satis",
    productName: "Buğday",
    category: "HUBUBATLAR",
    unit: "₺/kg",
    entryDate: "2026-01-15",
    avgPrice: "100",
    lowPrice: "95",
    highPrice: "105",
    ...overrides,
  };
}

test("toBulkRows omits sessionTime because databank sync does not provide it", () => {
  const [row] = toBulkRows([sampleEntry()]);
  assert.equal(row.sessionTime, null);
});

test("toBulkRows leaves changePct null when sync enrichment has no prior entry", () => {
  const [row] = toBulkRows([sampleEntry()]);
  assert.equal(row.changePct, null);
});
