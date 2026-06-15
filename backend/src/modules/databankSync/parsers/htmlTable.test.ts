import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { mapHomeRowToEntries } from "../mapper.js";
import { parseHomeTableHtml, parseTescilBulletinHtml } from "./htmlTable.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtureDir = path.join(__dirname, "../__fixtures__");

test("parseHomeTableHtml from fixture when present", async () => {
  const file = path.join(fixtureDir, "home-hububatlar.html");
  if (!fs.existsSync(file)) {
    console.log("skip: run databankPoc.ts to generate fixtures");
    return;
  }
  const html = fs.readFileSync(file, "utf8");
  const rows = parseHomeTableHtml(html, "HUBUBATLAR");
  assert.ok(rows.length >= 10);

  const bugdayHts = rows.find(
    (r) => r.saleType === "HTS" && r.sell.avg === "12.18",
  );
  assert.ok(bugdayHts, "BUĞDAY HTS satış ort. 12,18 satırı");
  const entries = mapHomeRowToEntries(bugdayHts!);
  const satis = entries.find((e) => e.productSlug.endsWith("-satis"));
  assert.ok(satis);
  assert.equal(satis!.avgPrice, "12.18");
  assert.equal(satis!.lowPrice, "10.5");
  assert.equal(satis!.highPrice, "14.6");
});

test("parseTescilBulletinHtml structure", async () => {
  const file = path.join(fixtureDir, "tescil-daily.html");
  if (!fs.existsSync(file)) {
    console.log("skip: run databankPoc.ts to generate fixtures");
    return;
  }
  const html = fs.readFileSync(file, "utf8");
  const rows = parseTescilBulletinHtml(html);
  assert.ok(rows.length >= 1);
  const pirinc = rows.find((r) => r.avg === "32.35");
  assert.ok(pirinc, "PİRİNÇ satırı");
  assert.equal(pirinc!.low, "28");
  assert.equal(pirinc!.high, "75.77");
  assert.equal(pirinc!.volume, "3320");
  assert.equal(pirinc!.volumeUnit, "KG");
  assert.equal(pirinc!.transactionAmount, "107408");
  assert.equal(pirinc!.transactionCount, 4);
  assert.equal(pirinc!.saleType, "HTS");
});
