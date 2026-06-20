import assert from "node:assert/strict";
import test from "node:test";
import {
  GREETING_REPLY,
  OFF_TOPIC_REPLY,
  OUT_OF_SCOPE_REPLY,
  THANKS_REPLY,
  classifySiteChatIntent,
} from "./siteChat.router.js";
import { buildPriceReply } from "./siteChat.priceHandler.js";
import type { CurrentPriceRow } from "../prices/prices.public.service.js";
import {
  SITE_CHAT_CMS_TTL_SEC,
  siteChatCmsCacheKey,
} from "../../lib/siteChatCache.js";

test("classifySiteChatIntent price queries", () => {
  assert.equal(classifySiteChatIntent("Patates fiyatı ne?"), "price");
  assert.equal(classifySiteChatIntent("Bugün bültende neler var?"), "price");
});

test("classifySiteChatIntent cms queries", () => {
  assert.equal(classifySiteChatIntent("Son haberler neler?"), "cms");
  assert.equal(classifySiteChatIntent("Yaklaşan etkinlik var mı?"), "cms");
});

test("classifySiteChatIntent off topic", () => {
  assert.equal(classifySiteChatIntent("Bitcoin alayım mı?"), "off_topic");
  assert.equal(classifySiteChatIntent("Buğday alayım mı?"), "off_topic");
  assert.equal(classifySiteChatIntent("Bugday alayim mi?"), "off_topic");
});

test("classifySiteChatIntent greeting and thanks", () => {
  assert.equal(classifySiteChatIntent("Merhaba"), "greeting");
  assert.equal(classifySiteChatIntent("Merhaba nasılsın"), "greeting");
  assert.equal(classifySiteChatIntent("Teşekkürler"), "thanks");
  assert.equal(classifySiteChatIntent("Sağol"), "thanks");
});

test("classifySiteChatIntent out of scope", () => {
  assert.equal(classifySiteChatIntent("Nasılsın"), "out_of_scope");
});

test("static replies are non-empty", () => {
  assert.ok(OFF_TOPIC_REPLY.length > 20);
  assert.ok(OUT_OF_SCOPE_REPLY.length > 20);
  assert.ok(GREETING_REPLY.length > 20);
  assert.ok(THANKS_REPLY.length > 20);
});

test("site chat cms cache key", () => {
  assert.equal(siteChatCmsCacheKey("etb:"), "etb:cache:site-chat:cms");
  assert.equal(SITE_CHAT_CMS_TTL_SEC, 300);
});

function sampleRow(
  overrides: Partial<CurrentPriceRow> = {},
): CurrentPriceRow {
  return {
    entry_id: "1",
    product_id: "p1",
    entry_date: "2026-06-15",
    avg_price: 12.61,
    low_price: 12,
    high_price: 13,
    change_pct: 0,
    volume: 1200,
    volume_unit: "KG",
    transaction_amount: 1000,
    transaction_count: 1,
    session_time: null,
    product_slug: "patates-hts-satis",
    product_name: "PATATES · HTS · Satış",
    product_category: "TEST",
    product_unit: "₺/kg",
    sort_order: 0,
    sparkline_series: [12.61],
    session_date: "2026-06-15",
    ...overrides,
  };
}

test("buildPriceReply single product match uses exact avg", () => {
  const rows = [sampleRow()];
  const reply = buildPriceReply("patates fiyatı", "2026-06-15", rows);
  assert.match(reply, /12,61/);
  assert.match(reply, /PATATES/);
});

test("buildPriceReply list all includes row count", () => {
  const rows = [sampleRow(), sampleRow({ product_name: "ARMUT · HTS · Satış", avg_price: 70 })];
  const reply = buildPriceReply("bültende neler var", "2026-06-15", rows);
  assert.match(reply, /2 ürün/);
});

test("buildPriceReply unknown product", () => {
  const reply = buildPriceReply("xyz ürün fiyatı", "2026-06-15", [sampleRow()]);
  assert.match(reply, /bulamadım/i);
});
