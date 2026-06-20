/**
 * Sync Kadayıf recipe TS source → backend Gemini context JSON.
 * Run via: npm run sync:recipe-context (backend package.json)
 */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildKadayifGeminiContextPayload } from "../src/data/kadayif-dolmasi-recipe.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = resolve(
  root,
  "backend/src/data/kadayif-dolmasi-gemini-context.json",
);

const payload = buildKadayifGeminiContextPayload();
writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`Wrote ${outPath}`);
