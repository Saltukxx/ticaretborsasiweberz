import assert from "node:assert/strict";
import { test } from "node:test";
import { isSafeHref, safeHref } from "./safeHref";

test("safeHref rejects protocol-relative URLs used in chat markdown", () => {
  assert.equal(isSafeHref("//evil.example/phish"), false);
  assert.equal(safeHref("//evil.example/phish"), "#");
});

test("safeHref allows same-origin paths for chat links", () => {
  assert.equal(isSafeHref("/fiyat-bulteni"), true);
  assert.equal(safeHref("/fiyat-bulteni"), "/fiyat-bulteni");
});
