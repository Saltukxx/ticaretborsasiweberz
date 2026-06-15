import assert from "node:assert/strict";
import test from "node:test";
import {
  decodeHtmlBuffer,
  repairUtf8Mojibake,
} from "./encoding.js";

function utf8AsLatin1(s: string): string {
  return Buffer.from(s, "utf8").toString("latin1");
}

test("repairUtf8Mojibake fixes UTF-8 misread as Latin-1", () => {
  assert.equal(repairUtf8Mojibake(utf8AsLatin1("BUĞDAY")), "BUĞDAY");
  assert.equal(repairUtf8Mojibake(utf8AsLatin1("Tüm Gruplar")), "Tüm Gruplar");
  assert.equal(repairUtf8Mojibake(utf8AsLatin1("PİRİNÇ")), "PİRİNÇ");
  assert.equal(repairUtf8Mojibake("BUĞDAY"), "BUĞDAY");
});

test("decodeHtmlBuffer prefers UTF-8 when meta says utf-8", () => {
  const html =
    '<html><head><meta charset="utf-8"></head><body>BUĞDAY</body></html>';
  const buf = Buffer.from(html, "utf8");
  const out = decodeHtmlBuffer(buf);
  assert.ok(out.includes("BUĞDAY"));
  assert.ok(!out.includes(utf8AsLatin1("Ğ").charAt(0) === "Ğ" ? "NEVER" : utf8AsLatin1("BUĞDAY")));
});
