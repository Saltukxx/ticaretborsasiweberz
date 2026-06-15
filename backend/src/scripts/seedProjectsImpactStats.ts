/**
 * Seed projects impact block stats (group_key = projects_impact).
 * Run: npx tsx src/scripts/seedProjectsImpactStats.ts
 */
import { eq } from "drizzle-orm";
import { createPool, createDb } from "../db/connection.js";
import { loadConfig } from "../config.js";
import { statsSnapshot } from "../db/schema/index.js";

const ROWS = [
  { label: "Dijital hizmet adımı", value: "6", sortOrder: 0 },
  { label: "Standart rapor", value: "12", sortOrder: 1 },
  { label: "Üye temas noktası", value: "4", sortOrder: 2 },
  { label: "Şeffaf veri seti", value: "8", sortOrder: 3 },
] as const;

async function main() {
  const config = loadConfig();
  const pool = createPool(config);
  const db = createDb(pool);

  const existing = await db
    .select({ id: statsSnapshot.id })
    .from(statsSnapshot)
    .where(eq(statsSnapshot.groupKey, "projects_impact"));

  if (existing.length > 0) {
    console.log(`Projects impact stats already present (${existing.length}), skipped.`);
    await pool.end();
    return;
  }

  for (const row of ROWS) {
    await db.insert(statsSnapshot).values({
      label: row.label,
      value: row.value,
      groupKey: "projects_impact",
      sortOrder: row.sortOrder,
    });
  }

  console.log(`Seeded ${ROWS.length} projects_impact stats.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
