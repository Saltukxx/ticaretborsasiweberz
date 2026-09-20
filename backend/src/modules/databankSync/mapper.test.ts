import assert from "node:assert/strict";
import test from "node:test";
import { toBulkRows } from "./mapper.js";
import type { MappedPriceEntry } from "./types.js";

function sampleEntry(overrides: Partial<MappedPriceEntry> = {}): MappedPriceEntry {
  return {
    productSlug: "bugday-satis",
    entryDate: "2026-01-15",
    avgPrice: "100",
    lowPrice: "95",
    highPrice: "105",
    changePct: null,
    volume: null,
    volumeUnit: null,
    transactionAmount: null,
    transactionCount: null,
    source: "tescil",
    ...overrides,
  };
}

test("toBulkRows omits sessionTime because databank sync does not provide it", () => {
  const [row] = toBulkRows([sampleEntry()]);
  assert.equal(row.sessionTime, null);
});
