/**
 * Seed corporate profile + milestones from legacy static content.
 * Run: npx tsx src/scripts/seedCorporate.ts
 */
import { createPool, createDb } from "../db/connection.js";
import { loadConfig } from "../config.js";
import {
  ensureCorporateProfile,
  createMilestone,
  listCorporateMilestonesAdmin,
} from "../modules/corporate/corporate.admin.service.js";

const MILESTONES = [
  {
    year: "1946",
    title: "Kuruluş",
    description:
      "Erzurum Ticaret Borsası, bölgesel ticaretin kurumsal omurgası olarak kuruldu.",
    sortOrder: 0,
  },
  {
    year: "1978",
    title: "Hububat Tescil Merkezi",
    description:
      "Bölgenin hububat tescili ve fiyat şeffaflığı için merkez konuma yükseldi.",
    sortOrder: 1,
  },
  {
    year: "1996",
    title: "Akreditasyon",
    description: "TOBB nezdinde akredite oda/borsa statüsü kazanıldı.",
    sortOrder: 2,
  },
  {
    year: "2014",
    title: "Elektronik Tescil",
    description: "Tescil ve üye işlemleri tam dijital altyapıya taşındı.",
    sortOrder: 3,
  },
  {
    year: "2026",
    title: "Dijital Borsa Platformu",
    description:
      "Modern fiyat bülteni, canlı veri akışı ve kurumsal dijital portal yayında.",
    sortOrder: 4,
  },
] as const;

async function main() {
  const config = loadConfig();
  const pool = createPool(config);
  const db = createDb(pool);

  await ensureCorporateProfile(db);

  const existing = await listCorporateMilestonesAdmin(db);
  if (existing.length === 0) {
    for (const m of MILESTONES) {
      await createMilestone(db, m);
    }
    console.log(`Seeded ${MILESTONES.length} corporate milestones.`);
  } else {
    console.log(`Corporate milestones already present (${existing.length}), skipped.`);
  }

  console.log("Corporate profile ready.");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
