import assert from "node:assert/strict";
import test from "node:test";
import { formatSaleTypeLabel, formatBulletinProductName } from "./priceDisplay.js";

test("formatSaleTypeLabel expands HTS and HMS", () => {
  assert.equal(formatSaleTypeLabel("HTS"), "Hazır Tüccar Satış");
  assert.equal(formatSaleTypeLabel("HMS"), "Hazır Müstahsil Satış");
});

test("formatSaleTypeLabel expands HTSG", () => {
  assert.equal(formatSaleTypeLabel("HTSG"), "Hazır Tüccar Satış Geç.");
});

test("formatSaleTypeLabel returns unknown codes unchanged", () => {
  assert.equal(formatSaleTypeLabel("XYZ"), "XYZ");
});

test("formatBulletinProductName expands sale type and side in display name", () => {
  assert.equal(
    formatBulletinProductName("AYÇIÇEK YAĞI · HTS · Satis"),
    "AYÇIÇEK YAĞI · Hazır Tüccar Satış · Satış",
  );
});
