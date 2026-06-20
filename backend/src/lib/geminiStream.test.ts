import assert from "node:assert/strict";
import test from "node:test";
import {
  appendShortResponseHint,
  extractTextFromStreamChunk,
  parseGeminiSseBuffer,
} from "./geminiStream.js";

test("appendShortResponseHint adds brevity instruction", () => {
  const out = appendShortResponseHint("Base prompt.");
  assert.match(out, /kısa tut/i);
  assert.match(out, /Base prompt/);
});

test("parseGeminiSseBuffer extracts text deltas", () => {
  const buffer = [
    'data: {"candidates":[{"content":{"parts":[{"text":"Mer"}]}}]}',
    "",
    'data: {"candidates":[{"content":{"parts":[{"text":"haba"}]}}]}',
  ].join("\n");

  const deltas = [...parseGeminiSseBuffer(buffer)];
  assert.deepEqual(deltas, ["Mer", "haba"]);
});

test("extractTextFromStreamChunk joins parts", () => {
  const text = extractTextFromStreamChunk({
    candidates: [{ content: { parts: [{ text: "A" }, { text: "B" }] } }],
  });
  assert.equal(text, "AB");
});
