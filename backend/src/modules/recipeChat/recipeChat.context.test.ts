import assert from "node:assert/strict";
import test from "node:test";
import { buildGeminiRecipeFullSystemInstruction } from "./recipeChat.context.js";

test("recipe context omits video command instructions", () => {
  const instruction = buildGeminiRecipeFullSystemInstruction(0);
  assert.doesNotMatch(instruction, /\[\[VIDEO:/);
  assert.doesNotMatch(instruction, /Video kontrolü/);
});

test("recipe context uses compact JSON without pretty print", () => {
  const instruction = buildGeminiRecipeFullSystemInstruction(1);
  assert.doesNotMatch(instruction, /```json/);
  assert.match(instruction, /"name":"Kadayıf Dolması"/);
  assert.match(instruction, /"currentStep"/);
});

test("recipe context step 0 includes steps overview", () => {
  const instruction = buildGeminiRecipeFullSystemInstruction(0);
  assert.match(instruction, /stepsOverview/);
});
