/**
 * One-time seed from src/seed-data/geo-indications.json (from geographical-indications.ts).
 * Run: npx tsx src/scripts/seedGeoIndications.ts
 * Docker: node dist/scripts/seedGeoIndications.js
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { eq } from "drizzle-orm";
import { createPool, createDb } from "../db/connection.js";
import { loadConfig } from "../config.js";
import { geographicalIndications as geoTable } from "../db/schema/index.js";

type SeedRow = {
  id: string;
  name: string;
  category: string;
  type: string;
  registration: string;
  district?: string;
  highlight?: boolean;
  story?: string;
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const jsonPath = join(__dirname, "../seed-data/geo-indications.json");

function loadRows(): SeedRow[] {
  const raw = readFileSync(jsonPath, "utf8");
  return JSON.parse(raw) as SeedRow[];
}

function parseRegistration(registration: string): {
  registeredAt: string | null;
  registrationNo: string | null;
} {
  const parts = registration.split("·").map((s) => s.trim());
  if (parts.length === 0) return { registeredAt: null, registrationNo: null };

  const datePart = parts[0]!;
  const noPart = parts[1] ?? null;
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(datePart);
  const registeredAt = m ? `${m[3]}-${m[2]}-${m[1]}` : null;

  return {
    registeredAt,
    registrationNo: noPart,
  };
}

async function main() {
  const rows = loadRows();
  const config = loadConfig();
  const pool = createPool(config);
  const db = createDb(pool);

  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < rows.length; i++) {
    const item = rows[i]!;
    const { registeredAt, registrationNo } = parseRegistration(item.registration);

    const [existing] = await db
      .select({ slug: geoTable.slug })
      .from(geoTable)
      .where(eq(geoTable.slug, item.id))
      .limit(1);

    if (existing) {
      skipped++;
      continue;
    }

    await db.insert(geoTable).values({
      slug: item.id,
      name: item.name,
      category: item.category,
      type: item.type,
      registrationNo,
      registeredAt,
      district: item.district ?? null,
      isHighlight: item.highlight ?? false,
      story: item.story ?? null,
      sortOrder: i,
      isActive: true,
    });
    inserted++;
  }

  console.log(
    `Geo seed done: ${inserted} inserted, ${skipped} skipped (existing slug).`,
  );
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
