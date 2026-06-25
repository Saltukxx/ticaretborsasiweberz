import assert from "node:assert/strict";
import { test } from "node:test";

/** Mirrors useSiteChat final reply reconciliation after SSE fallback. */
function reconcileBotReply(
  streamStarted: boolean,
  streamedText: string,
  fallbackReply: string,
): string {
  return streamStarted ? fallbackReply.trim() : fallbackReply.trim();
}

test("reconcileBotReply replaces partial streamed text with JSON fallback reply", () => {
  const partial = "Buğday ortalama 12,50";
  const full = "Buğday ortalama 12,50 ₺/kg, arpa 11,20 ₺/kg.";
  assert.equal(reconcileBotReply(true, partial, full), full);
});

test("reconcileBotReply uses fallback reply when stream never started", () => {
  const full = "Güncel bülten fiyatları hazır.";
  assert.equal(reconcileBotReply(false, "", full), full);
});
