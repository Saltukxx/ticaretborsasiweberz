/**
 * Kurumsal belge HTML içeriklerini veritabanına yazar (PDF çıkarımının yerine düzenlenmiş içerik).
 * Run: npx tsx src/scripts/seedCorporateBodies.ts
 * Env: FORCE=1 — mevcut body üzerine yazar
 */
import { eq } from "drizzle-orm";
import { createPool, createDb } from "../db/connection.js";
import { loadConfig } from "../config.js";
import { corporateDocuments } from "../db/schema/index.js";
import { sanitizeRichHtml } from "../lib/sanitizeHtml.js";
import { CORPORATE_BODY_BY_SLUG } from "../seed-data/corporate-bodies/content.js";

async function main() {
  const config = loadConfig();
  const pool = createPool(config);
  const db = createDb(pool);
  const force = process.env.FORCE === "1" || process.env.FORCE === "true";

  let updated = 0;
  let skipped = 0;

  for (const [slug, rawHtml] of Object.entries(CORPORATE_BODY_BY_SLUG)) {
    const [row] = await db
      .select({ id: corporateDocuments.id, body: corporateDocuments.body })
      .from(corporateDocuments)
      .where(eq(corporateDocuments.slug, slug))
      .limit(1);

    if (!row) {
      console.warn(`Skip (not found): ${slug}`);
      skipped += 1;
      continue;
    }

    if (!force && row.body?.trim()) {
      console.log(`Skip (has body): ${slug}`);
      skipped += 1;
      continue;
    }

    const body = sanitizeRichHtml(rawHtml);
    await db
      .update(corporateDocuments)
      .set({ body, updatedAt: new Date() })
      .where(eq(corporateDocuments.id, row.id));

    console.log(`Updated: ${slug}`);
    updated += 1;
  }

  // Organizasyon şeması: mevcut img'yi corp-figure ile sar
  const [org] = await db
    .select({ id: corporateDocuments.id, body: corporateDocuments.body })
    .from(corporateDocuments)
    .where(eq(corporateDocuments.slug, "organizasyon-semasi"))
    .limit(1);

  if (org?.body?.includes("<img") && !org.body.includes("corp-figure")) {
    const wrapped = org.body.replace(
      /<p><img([^>]+)><\/p>/i,
      '<figure class="corp-figure"><img$1></figure><p>Erzurum Ticaret Borsası\'nın güncel organizasyon yapısı ve birim ilişkileri aşağıda gösterilmektedir.</p>',
    );
    await db
      .update(corporateDocuments)
      .set({ body: sanitizeRichHtml(wrapped + `\n${`<div class="corp-doc-page__sign"><p>Onaylayan</p><strong>Yıldırım Hakan ORAL</strong><p>Yönetim Kurulu Başkanı</p></div>`}`), updatedAt: new Date() })
      .where(eq(corporateDocuments.id, org.id));
    console.log("Updated: organizasyon-semasi (figure wrap)");
    updated += 1;
  }

  console.log(`Done. updated=${updated} skipped=${skipped}`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
