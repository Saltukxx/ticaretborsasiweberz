import assert from "node:assert/strict";
import { test } from "node:test";
import {
  shouldSkipBulletinSlugShrink,
  storeBulletinSessionSlugs,
} from "./pricesCache.js";

test("shouldSkipBulletinSlugShrink rejects major shrinks only", () => {
  assert.equal(shouldSkipBulletinSlugShrink(80, 12), true);
  assert.equal(shouldSkipBulletinSlugShrink(80, 40), false);
  assert.equal(shouldSkipBulletinSlugShrink(80, 79), false);
  assert.equal(shouldSkipBulletinSlugShrink(0, 5), false);
});

test("storeBulletinSessionSlugs keeps cached slugs on partial tescil parse", async () => {
  const store = new Map<string, string>();
  const redis = {
    async get(key: string) {
      return store.get(key) ?? null;
    },
    async set(key: string, value: string) {
      store.set(key, value);
    },
  };

  const fullEntries = Array.from({ length: 80 }, (_, i) => ({
    productSlug: `urun-${i}-satis`,
    productName: `Urun ${i}`,
    category: "TEST",
    unit: "₺/kg",
    entryDate: "2026-06-23",
    avgPrice: "10",
    lowPrice: "9",
    highPrice: "11",
    changePct: null,
    volume: null,
    volumeUnit: null,
    transactionAmount: null,
    transactionCount: null,
  }));

  await storeBulletinSessionSlugs(redis as never, "etb:", fullEntries);

  const partialEntries = fullEntries.slice(0, 12);
  await storeBulletinSessionSlugs(redis as never, "etb:", partialEntries);

  const cached = JSON.parse(
    store.get("etb:cache:bulletin:slugs:2026-06-23") ?? "[]",
  ) as string[];

  assert.equal(cached.length, 80);
});
