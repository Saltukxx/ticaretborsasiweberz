/**
 * Kurumsal PDF belgelerinden HTML içerik çıkarır ve corporate_documents.body alanına yazar.
 * Run: npx tsx src/scripts/extractCorporateDocBodies.ts
 * Env: CORPORATE_DOCS_DIR — yerel PDF klasörü (storage erişilemezse fallback)
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { asc, eq, isNull, or, sql } from "drizzle-orm";
import { createPool, createDb } from "../db/connection.js";
import { loadConfig } from "../config.js";
import { admins, corporateDocuments, media } from "../db/schema/index.js";
import { readMediaBuffer } from "../lib/readMediaBuffer.js";
import {
  extractPdfTextHtml,
  renderPdfPageToPng,
} from "../lib/pdfTextExtract.js";
import { uploadMediaPublic } from "../modules/media/media.admin.service.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ORG_CHART_SLUG = "organizasyon-semasi";

const LOCAL_PDF_MAP: Record<string, string> = {
  "borsa-tarihce": "borsatarihce.pdf",
  "organizasyon-semasi": "organizasyon semasi.pdf",
  "2024-is-plani": "2024 is plani.pdf",
  "etik-kurallar": "etik kurallar.pdf",
  "insan-kaynaklari-politikasi": "insan kaynaklari politikasi.pdf",
  "uye-iliskileri-politikasi": "uye iliskileri politikasi.pdf",
  "mali-politika": "mali politika.pdf",
  "uye-memnuniyet-politikasi": "uyememnuniyet politikasi.pdf",
  "bilgi-iletisim-politikasi": "bilgi ve iletisim politikasi.pdf",
  "kurumsal-risk-politikasi": "kurumsal risk politikasi.pdf",
  "haberlesme-politikasi": "haberlesme politikasi.pdf",
};

async function loadPdfBuffer(
  config: ReturnType<typeof loadConfig>,
  slug: string,
  file: { storageKey: string; publicUrl: string },
  docsDir: string,
): Promise<Buffer | null> {
  const fromStorage = await readMediaBuffer(config, file);
  if (fromStorage) return fromStorage;

  const localName = LOCAL_PDF_MAP[slug];
  if (!localName) return null;
  const filePath = join(docsDir, localName);
  if (!existsSync(filePath)) return null;
  return readFileSync(filePath);
}

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

  const rows = await db
    .select({
      id: corporateDocuments.id,
      slug: corporateDocuments.slug,
      title: corporateDocuments.title,
      body: corporateDocuments.body,
      storageKey: media.storageKey,
      publicUrl: media.publicUrl,
    })
    .from(corporateDocuments)
    .innerJoin(media, eq(corporateDocuments.fileId, media.id))
    .where(
      or(
        isNull(corporateDocuments.body),
        sql`trim(${corporateDocuments.body}) = ''`,
      ),
    )
    .orderBy(asc(corporateDocuments.sortOrder));

  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const buffer = await loadPdfBuffer(
      config,
      row.slug,
      { storageKey: row.storageKey, publicUrl: row.publicUrl },
      docsDir,
    );
    if (!buffer) {
      console.warn(`Skip (no PDF): ${row.slug}`);
      skipped += 1;
      continue;
    }

    let body = "";

    if (row.slug === ORG_CHART_SLUG) {
      try {
        const png = await renderPdfPageToPng(buffer, 1, 2.5);
        const upload = await uploadMediaPublic(db, config, {
          buffer: png,
          filename: "organizasyon-semasi.png",
          mimetype: "image/png",
          adminId: admin.id,
        });
        if (!upload.ok) {
          console.warn(`PNG upload failed: ${row.slug}`);
          skipped += 1;
          continue;
        }
        body = `<p><img src="${upload.row.publicUrl}" alt="Organizasyon Şeması" loading="lazy" /></p>`;
      } catch (err) {
        console.warn(`Org chart render failed: ${row.slug}`, err);
        skipped += 1;
        continue;
      }
    } else {
      try {
        body = await extractPdfTextHtml(buffer);
      } catch (err) {
        console.warn(`Text extract failed: ${row.slug}`, err);
        skipped += 1;
        continue;
      }
    }

    if (!body.trim()) {
      console.warn(`Skip (empty body): ${row.slug}`);
      skipped += 1;
      continue;
    }

    await db
      .update(corporateDocuments)
      .set({ body, updatedAt: new Date() })
      .where(eq(corporateDocuments.id, row.id));

    console.log(`Updated: ${row.title}`);
    updated += 1;
  }

  console.log(`Done. updated=${updated} skipped=${skipped}`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
