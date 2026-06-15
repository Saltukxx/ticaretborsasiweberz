/**
 * Seed Erzurum map district rows (merkez + 17 ilçe).
 * Slug positions stay in frontend src/lib/mapDistrictPositions.ts
 * Run: npx tsx src/scripts/seedMapDistricts.ts
 */
import { inArray } from "drizzle-orm";
import { createPool, createDb } from "../db/connection.js";
import { loadConfig } from "../config.js";
import { mapDistricts } from "../db/schema/index.js";

const METRO_SLUGS = ["yakutiye", "aziziye", "palandoken"] as const;

const ROWS = [
  {
    slug: "merkez",
    label: "Erzurum Merkez",
    productLine: "Hububat · Tescil Merkezi",
    dailyVolume: "—",
    memberCount: 0,
    registrationCount: 0,
    sortOrder: -1,
  },
  {
    slug: "askale",
    label: "Aşkale",
    productLine: "Hububat · Yemlik",
    dailyVolume: "—",
    memberCount: 0,
    registrationCount: 0,
    sortOrder: 0,
  },
  {
    slug: "cat",
    label: "Çat",
    productLine: "Yemlik · Arpa",
    dailyVolume: "—",
    memberCount: 0,
    registrationCount: 0,
    sortOrder: 1,
  },
  {
    slug: "hinis",
    label: "Hınıs",
    productLine: "Hububat · Bakliyat",
    dailyVolume: "—",
    memberCount: 0,
    registrationCount: 0,
    sortOrder: 2,
  },
  {
    slug: "horasan",
    label: "Horasan",
    productLine: "Hububat · Bakliyat",
    dailyVolume: "—",
    memberCount: 0,
    registrationCount: 0,
    sortOrder: 3,
  },
  {
    slug: "ispir",
    label: "İspir",
    productLine: "Süt · Tarımsal üretim",
    dailyVolume: "—",
    memberCount: 0,
    registrationCount: 0,
    sortOrder: 4,
  },
  {
    slug: "karacoban",
    label: "Karaçoban",
    productLine: "Hububat · Hayvancılık",
    dailyVolume: "—",
    memberCount: 0,
    registrationCount: 0,
    sortOrder: 5,
  },
  {
    slug: "karayazi",
    label: "Karayazı",
    productLine: "Hububat · Mera hayvancılığı",
    dailyVolume: "—",
    memberCount: 0,
    registrationCount: 0,
    sortOrder: 6,
  },
  {
    slug: "koprukoy",
    label: "Köprüköy",
    productLine: "Hububat · Tarımsal ticaret",
    dailyVolume: "—",
    memberCount: 0,
    registrationCount: 0,
    sortOrder: 7,
  },
  {
    slug: "narman",
    label: "Narman",
    productLine: "Hububat",
    dailyVolume: "—",
    memberCount: 0,
    registrationCount: 0,
    sortOrder: 8,
  },
  {
    slug: "oltu",
    label: "Oltu",
    productLine: "Tarımsal karışık · Orman ürünleri",
    dailyVolume: "—",
    memberCount: 0,
    registrationCount: 0,
    sortOrder: 9,
  },
  {
    slug: "olur",
    label: "Olur",
    productLine: "Hayvancılık · Hububat",
    dailyVolume: "—",
    memberCount: 0,
    registrationCount: 0,
    sortOrder: 10,
  },
  {
    slug: "pasinler",
    label: "Pasinler",
    productLine: "Buğday · Arpa",
    dailyVolume: "—",
    memberCount: 0,
    registrationCount: 0,
    sortOrder: 11,
  },
  {
    slug: "pazaryolu",
    label: "Pazaryolu",
    productLine: "Hayvancılık · Orman ürünleri",
    dailyVolume: "—",
    memberCount: 0,
    registrationCount: 0,
    sortOrder: 12,
  },
  {
    slug: "senkaya",
    label: "Şenkaya",
    productLine: "Hububat · Hayvancılık",
    dailyVolume: "—",
    memberCount: 0,
    registrationCount: 0,
    sortOrder: 13,
  },
  {
    slug: "tekman",
    label: "Tekman",
    productLine: "Hububat · Yemlik",
    dailyVolume: "—",
    memberCount: 0,
    registrationCount: 0,
    sortOrder: 14,
  },
  {
    slug: "tortum",
    label: "Tortum",
    productLine: "Hayvancılık · Meyve",
    dailyVolume: "—",
    memberCount: 0,
    registrationCount: 0,
    sortOrder: 15,
  },
  {
    slug: "uzundere",
    label: "Uzundere",
    productLine: "Tarımsal üretim · Hayvancılık",
    dailyVolume: "—",
    memberCount: 0,
    registrationCount: 0,
    sortOrder: 16,
  },
] as const;

async function main() {
  const config = loadConfig();
  const pool = createPool(config);
  const db = createDb(pool);

  for (const row of ROWS) {
    await db
      .insert(mapDistricts)
      .values({ ...row, isActive: true })
      .onConflictDoUpdate({
        target: mapDistricts.slug,
        set: {
          label: row.label,
          productLine: row.productLine,
          dailyVolume: row.dailyVolume,
          memberCount: row.memberCount,
          registrationCount: row.registrationCount,
          sortOrder: row.sortOrder,
          isActive: true,
          updatedAt: new Date(),
        },
      });
  }

  await db
    .update(mapDistricts)
    .set({ isActive: false, updatedAt: new Date() })
    .where(inArray(mapDistricts.slug, [...METRO_SLUGS]));

  console.log(`Seeded ${ROWS.length} map districts; metro slugs hidden.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
