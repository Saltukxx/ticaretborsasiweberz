import assert from "node:assert/strict";
import test from "node:test";
import type { CurrentPriceRow } from "./publicApi.js";
import {
  DEFAULT_BULLETIN_FILTERS,
  applyBulletinFilters,
  compareByCountDesc,
} from "./bulletinFilters.js";

function row(
  name: string,
  transaction_count: number | null,
): CurrentPriceRow {
  return {
    entry_id: "1",
    product_id: "p1",
    entry_date: "2026-06-15",
    avg_price: 10,
    low_price: 9,
    high_price: 11,
    change_pct: 0,
    volume: 100,
    volume_unit: "KG",
    transaction_amount: 1000,
    transaction_count,
    session_time: null,
    product_slug: "test",
    product_name: name,
    product_category: "TEST",
    product_unit: "₺/kg",
    sort_order: 0,
    sparkline_series: [10],
  };
}

test("compareByCountDesc sorts by transaction count descending", () => {
  const sorted = [row("A", 5), row("B", 20), row("C", 10)].sort(compareByCountDesc);
  assert.deepEqual(
    sorted.map((r) => r.transaction_count),
    [20, 10, 5],
  );
});

test("applyBulletinFilters default and count-desc produce same order", () => {
  const products = [row("A", 3), row("B", 15), row("C", 8)];
  const byDefault = applyBulletinFilters(products, DEFAULT_BULLETIN_FILTERS);
  const byCount = applyBulletinFilters(products, {
    ...DEFAULT_BULLETIN_FILTERS,
    sort: "count-desc",
  });
  assert.deepEqual(
    byDefault.map((p) => p.product_name),
    byCount.map((p) => p.product_name),
  );
  assert.equal(byDefault[0]?.product_name, "B");
});

test("DEFAULT_BULLETIN_FILTERS uses default sort key", () => {
  assert.equal(DEFAULT_BULLETIN_FILTERS.sort, "default");
});
