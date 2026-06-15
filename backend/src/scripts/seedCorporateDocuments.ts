/**
 * Kurumsal PDF belgelerini medya kütüphanesine yükler ve corporate_documents tablosuna kaydeder.
 * Run: npx tsx src/scripts/seedCorporateDocuments.ts
 * Env: CORPORATE_DOCS_DIR — PDF klasörü (varsayılan: ../seed-data/corporate-docs)
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { asc, eq } from "drizzle-orm";
import { createPool, createDb } from "../db/connection.js";
import { loadConfig } from "../config.js";
import { admins, corporateDocuments } from "../db/schema/index.js";
import { uploadMediaPublic } from "../modules/media/media.admin.service.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const DOC_SEEDS = [
  {
    slug: "borsa-tarihce",
    title: "Borsa Tarihçesi",
    category: "tarihce",
    filename: "borsatarihce.pdf",
    summary: "Erzurum Ticaret Borsası'nın kuruluşundan günümüze kurumsal tarihçesi.",
    sortOrder: 0,
  },
  {
    slug: "organizasyon-semasi",
    title: "Organizasyon Şeması",
    category: "organizasyon",
    filename: "organizasyon semasi.pdf",
    summary: "Borsanın güncel organizasyon yapısı ve birim ilişkileri.",
    sortOrder: 10,
  },
  {
    slug: "2024-is-plani",
    title: "2024 İş Planı",
    category: "plan",
    filename: "2024 is plani.pdf",
    summary: "2024 yılı kurumsal iş planı ve hedefleri.",
    sortOrder: 20,
  },
  {
    slug: "etik-kurallar",
    title: "Etik Kurallar",
    category: "politika",
    filename: "etik kurallar.pdf",
    summary: "Kurumsal etik ilkeler ve davranış kuralları.",
    sortOrder: 100,
  },
  {
    slug: "insan-kaynaklari-politikasi",
    title: "İnsan Kaynakları Politikası",
    category: "politika",
    filename: "insan kaynaklari politikasi.pdf",
    summary: "İnsan kaynakları yönetimi ve personel politikaları.",
    sortOrder: 110,
  },
  {
    slug: "uye-iliskileri-politikasi",
    title: "Üye İlişkileri Politikası",
    category: "politika",
    filename: "uye iliskileri politikasi.pdf",
    summary: "Üyelerle ilişkiler, hizmet standartları ve süreçler.",
    sortOrder: 120,
  },
  {
    slug: "mali-politika",
    title: "Mali Politika",
    category: "politika",
    filename: "mali politika.pdf",
    summary: "Mali yönetim, bütçe ve muhasebe politikaları.",
    sortOrder: 130,
  },
  {
    slug: "uye-memnuniyet-politikasi",
    title: "Üye Memnuniyet Politikası",
    category: "politika",
    filename: "uyememnuniyet politikasi.pdf",
    summary: "Üye memnuniyetini ölçme ve iyileştirme çerçevesi.",
    sortOrder: 140,
  },
  {
    slug: "bilgi-iletisim-politikasi",
    title: "Bilgi ve İletişim Politikası",
    category: "politika",
    filename: "bilgi ve iletisim politikasi.pdf",
    summary: "Kurumsal iletişim ve bilgi yönetimi ilkeleri.",
    sortOrder: 150,
  },
  {
    slug: "kurumsal-risk-politikasi",
    title: "Kurumsal Risk Politikası",
    category: "politika",
    filename: "kurumsal risk politikasi.pdf",
    summary: "Risk yönetimi ve iç kontrol politikaları.",
    sortOrder: 160,
  },
  {
    slug: "haberlesme-politikasi",
    title: "Haberleşme Politikası",
    category: "politika",
    filename: "haberlesme politikasi.pdf",
    summary: "Resmî haberleşme, yazışma ve arşivleme standartları.",
    sortOrder: 170,
  },
] as const;

async function main() {
  const config = loadConfig();
  const pool = createPool(config);
  const db = createDb(pool);

  const docsDir =
    process.env.CORPORATE_DOCS_DIR?.trim() ||
    join(__dirname, "../seed-data/corporate-docs");

  const [admin] = await db
    .select({ id: admins.id })
    .from(admins)
    .orderBy(asc(admins.createdAt))
    .limit(1);

  if (!admin) {
    console.error("No admin user found.");
    process.exit(1);
  }

  let uploaded = 0;
  let skipped = 0;

  for (const doc of DOC_SEEDS) {
    const [existing] = await db
      .select({ id: corporateDocuments.id })
      .from(corporateDocuments)
      .where(eq(corporateDocuments.slug, doc.slug))
      .limit(1);

    if (existing) {
      console.log(`Skip (exists): ${doc.slug}`);
      skipped += 1;
      continue;
    }

    const filePath = join(docsDir, doc.filename);
    if (!existsSync(filePath)) {
      console.warn(`Missing file: ${filePath}`);
      continue;
    }

    const buffer = readFileSync(filePath);
    const result = await uploadMediaPublic(db, config, {
      buffer,
      filename: doc.filename,
      mimetype: "application/pdf",
      adminId: admin.id,
    });

    if (!result.ok) {
      console.warn(`Upload failed: ${doc.slug}`);
      continue;
    }

    await db.insert(corporateDocuments).values({
      slug: doc.slug,
      title: doc.title,
      summary: doc.summary,
      category: doc.category,
      fileId: result.row.id,
      sortOrder: doc.sortOrder,
      isPublished: true,
      createdBy: admin.id,
    });

    console.log(`Seeded: ${doc.title}`);
    uploaded += 1;
  }

  console.log(`Done. uploaded=${uploaded} skipped=${skipped}`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
