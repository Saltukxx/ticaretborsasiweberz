import assert from "node:assert/strict";
import test from "node:test";
import { recipeChatBodySchema } from "./recipeChat.schema.js";

test("recipeChatBodySchema accepts valid payload", () => {
  const parsed = recipeChatBodySchema.safeParse({
    message: "Malzemeler neler?",
    history: [{ role: "user", text: "Merhaba" }],
    currentStep: 2,
  });
  assert.equal(parsed.success, true);
});

test("recipeChatBodySchema rejects message over 2000 chars", () => {
  const parsed = recipeChatBodySchema.safeParse({
    message: "x".repeat(2001),
    history: [],
  });
  assert.equal(parsed.success, false);
});

test("recipeChatBodySchema rejects history over 8 turns", () => {
  const history = Array.from({ length: 9 }, (_, i) => ({
    role: i % 2 === 0 ? ("user" as const) : ("model" as const),
    text: `turn ${i}`,
  }));
  const parsed = recipeChatBodySchema.safeParse({
    message: "test",
    history,
  });
  assert.equal(parsed.success, false);
});

test("recipeChatBodySchema accepts exactly 8 history turns", () => {
  const history = Array.from({ length: 8 }, (_, i) => ({
    role: i % 2 === 0 ? ("user" as const) : ("model" as const),
    text: `turn ${i}`,
  }));
  const parsed = recipeChatBodySchema.safeParse({
    message: "test",
    history,
  });
  assert.equal(parsed.success, true);
});
