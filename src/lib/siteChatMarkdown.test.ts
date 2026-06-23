import assert from "node:assert/strict";
import { test } from "node:test";
import { isSafeHref } from "./safeHref";

test("isSafeHref rejects protocol-relative URLs used for off-site navigation", () => {
  assert.equal(isSafeHref("//evil.example/phish"), false);
  assert.equal(isSafeHref("/duyurular"), true);
  assert.equal(isSafeHref("https://example.com"), true);
});
