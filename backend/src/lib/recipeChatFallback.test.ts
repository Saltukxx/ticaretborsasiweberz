import assert from "node:assert/strict";
import test from "node:test";
import {
  answerRecipeQuestion,
  RECIPE_CHAT_CONTEXT_MISSING,
} from "../../../src/lib/recipeChatFallback.ts";

test("answerRecipeQuestion returns ingredients list", () => {
  const ans = answerRecipeQuestion("Malzemeler neler?", 1);
  assert.ok(ans);
  assert.ok(ans!.includes("Tel kadayıf"));
});

test("answerRecipeQuestion returns context missing for diet", () => {
  const ans = answerRecipeQuestion("Kalori değeri nedir?", 1);
  assert.equal(ans, RECIPE_CHAT_CONTEXT_MISSING);
});

test("answerRecipeQuestion returns tescil info", () => {
  const ans = answerRecipeQuestion("Coğrafi tescil var mı?", 1);
  assert.ok(ans);
  assert.ok(ans!.includes("2012"));
});
