import assert from "node:assert/strict";
import test from "node:test";
import {
  extractVideoCommands,
  parseLocalVideoIntent,
  type RecipeVideoState,
} from "../../../src/lib/recipeVideoControl.ts";
import { kadayifDolmasiRecipe } from "../../../src/data/kadayif-dolmasi-recipe.ts";

const steps = kadayifDolmasiRecipe.steps;

const baseState: RecipeVideoState = {
  currentStep: 2,
  currentTime: 20,
  duration: 60,
  isPlaying: false,
  awaitingContinue: false,
};

test("extractVideoCommands strips VIDEO block and parses step command", () => {
  const raw =
    'Kızartma adımına geçiyorum.\n[[VIDEO:{"action":"step","step":4,"play":true}]]';
  const { cleanText, commands } = extractVideoCommands(raw);
  assert.ok(!cleanText.includes("[[VIDEO"));
  assert.equal(commands.length, 1);
  assert.deepEqual(commands[0], { action: "step", step: 4, play: true });
});

test("parseLocalVideoIntent pause and play", () => {
  assert.deepEqual(parseLocalVideoIntent("videoyu durdur", steps, baseState), {
    action: "pause",
  });
  assert.deepEqual(parseLocalVideoIntent("videoyu oynat", steps, baseState), {
    action: "play",
  });
});

test("parseLocalVideoIntent step by title", () => {
  const cmd = parseLocalVideoIntent("kızartma adımına git", steps, baseState);
  assert.equal(cmd?.action, "step");
  assert.equal(cmd?.step, 4);
});

test("parseLocalVideoIntent delta seconds", () => {
  const cmd = parseLocalVideoIntent("10 saniye ileri", steps, baseState);
  assert.deepEqual(cmd, { action: "delta", delta: 10 });
});
