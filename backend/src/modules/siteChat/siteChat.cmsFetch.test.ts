import assert from "node:assert/strict";
import test from "node:test";
import {
  SITE_CHAT_CMS_TTL_SEC,
  siteChatCmsCacheKey,
} from "../../lib/siteChatCache.js";

test("siteChatCmsCacheKey uses namespaced redis prefix", () => {
  assert.equal(siteChatCmsCacheKey("etb:"), "etb:cache:site-chat:cms");
  assert.equal(siteChatCmsCacheKey("prod:"), "prod:cache:site-chat:cms");
});

test("SITE_CHAT_CMS_TTL_SEC is five minutes", () => {
  assert.equal(SITE_CHAT_CMS_TTL_SEC, 300);
});
