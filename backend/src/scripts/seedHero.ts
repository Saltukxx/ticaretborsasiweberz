/**
 * Ensure hero_content row exists with default homepage copy.
 * Run: npx tsx src/scripts/seedHero.ts
 */
import { createPool, createDb } from "../db/connection.js";
import { loadConfig } from "../config.js";
import { ensureHeroContent } from "../modules/hero/hero.admin.service.js";

async function main() {
  const config = loadConfig();
  const pool = createPool(config);
  const db = createDb(pool);

  await ensureHeroContent(db);
  console.log("Hero content ready.");

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
