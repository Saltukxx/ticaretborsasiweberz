/**
 * Import news articles (text + images) from legacy erzurumtb.org.tr.
 *
 * Run:
 *   npx tsx src/scripts/importLegacyNews.ts --ids=6a1eedf1103fd79a5f539420,6a1eed09103fd79a5f5392ff
 *   npx tsx src/scripts/importLegacyNews.ts --all
 *   npx tsx src/scripts/importLegacyNews.ts --all --update --dry-run
 */
import { extname } from "node:path";
import * as cheerio from "cheerio";
import { asc, eq } from "drizzle-orm";
import { createPool, createDb } from "../db/connection.js";
import { loadConfig } from "../config.js";
import { admins, news } from "../db/schema/index.js";
import { uploadMediaPublic } from "../modules/media/media.admin.service.js";
import {
  createNews,
  patchNews,
} from "../modules/news/news.admin.service.js";
import { isValidSlug } from "../lib/slug.js";
import { connectRedis } from "../lib/redis.js";
import { bumpNewsCacheRevision } from "../lib/newsCache.js";
import { buildNewsExcerpt } from "../lib/truncateText.js";

const LEGACY_BASE = "https://www.erzurumtb.org.tr";
const USER_AGENT = "ETB-Legacy-News-Import/1.0";
/** Liste sayfası başına ~10 kart; boş sayfa gelene kadar devam eder. */
const MAX_LIST_PAGES = 30;

type JsonLdArticle = {
  headline?: string;
  description?: string;
  image?: string | string[];
  datePublished?: string;
};

type LegacyArticle = {
  legacyId: string;
  slug: string;
  title: string;
  excerpt: string;
  bodyHtml: string;
  category: string;
  tone: string;
  coverImageUrl: string | null;
  publishedAt: Date | null;
};

type CliOptions = {
  ids: string[] | null;
  all: boolean;
  update: boolean;
  dryRun: boolean;
  /** Duyuru kartlarını atla (varsayılan: sadece Haber). */
  haberOnly: boolean;
};

function parseArgs(argv: string[]): CliOptions {
  let ids: string[] | null = null;
  let all = false;
  let update = false;
  let dryRun = false;
  let haberOnly = true;

  for (const arg of argv) {
    if (arg === "--all") all = true;
    else if (arg === "--update") update = true;
    else if (arg === "--dry-run") dryRun = true;
    else if (arg === "--include-duyuru") haberOnly = false;
    else if (arg.startsWith("--ids=")) {
      ids = arg
        .slice("--ids=".length)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  return { ids, all, update, dryRun, haberOnly };
}

function resolveLegacyUrl(pathOrUrl: string): string {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  return `${LEGACY_BASE}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

function guessMime(url: string, header: string | null): string {
  if (header?.startsWith("image/")) return header.split(";")[0]!.trim();
  const ext = extname(url).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "image/jpeg";
}

function safeFilename(url: string): string {
  const base = url.split("/").pop() ?? "image.jpg";
  return base.replace(/[^\w.-]+/g, "_").slice(0, 200);
}

function toneForCategory(category: string): string {
  return category.toLowerCase() === "duyuru" ? "duyuru" : "kurumsal";
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(45000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

function parseJsonLdArticle(html: string): JsonLdArticle | null {
  const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]!) as unknown;
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (
          item &&
          typeof item === "object" &&
          (item as { "@type"?: string })["@type"] === "NewsArticle"
        ) {
          return item as JsonLdArticle;
        }
      }
    } catch {
      // try next block
    }
  }
  return null;
}

function parseProseBody(html: string): string {
  const $ = cheerio.load(html);
  const article = $("article.prose").first();
  if (article.length === 0) return "";
  return article.html()?.trim() ?? "";
}

function firstImageUrl(jsonLd: JsonLdArticle | null, bodyHtml: string): string | null {
  if (jsonLd?.image) {
    const img = Array.isArray(jsonLd.image) ? jsonLd.image[0] : jsonLd.image;
    if (img) return resolveLegacyUrl(img);
  }
  const $ = cheerio.load(bodyHtml);
  const src = $("img").first().attr("src");
  return src ? resolveLegacyUrl(src) : null;
}

async function fetchListMeta(page: number): Promise<Map<string, string>> {
  const html = await fetchText(`${LEGACY_BASE}/news/?page=${page}`);
  const $ = cheerio.load(html);
  const out = new Map<string, string>();

  $('a[href^="/news/"]').each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const m = href.match(/\/news\/([a-f0-9]+)/i);
    if (!m) return;
    const legacyId = m[1]!.toLowerCase();

    const card = $(el).closest("article").length
      ? $(el).closest("article")
      : $(el).closest("div");
    const badge = card
      .find("span")
      .filter((__, span) => /^(Haber|Duyuru)$/i.test($(span).text().trim()))
      .first()
      .text()
      .trim();
    if (badge) out.set(legacyId, badge);
  });

  return out;
}

async function collectAllLegacyIds(): Promise<string[]> {
  const ids = new Set<string>();
  for (let page = 1; page <= MAX_LIST_PAGES; page += 1) {
    const html = await fetchText(`${LEGACY_BASE}/news/?page=${page}`);
    const re = /\/news\/([a-f0-9]{24})/gi;
    let found = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      ids.add(m[1]!.toLowerCase());
      found += 1;
    }
    if (found === 0) break;
  }
  return [...ids];
}

async function buildCategoryMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (let page = 1; page <= MAX_LIST_PAGES; page += 1) {
    const pageMap = await fetchListMeta(page);
    if (pageMap.size === 0) break;
    for (const [id, cat] of pageMap) map.set(id, cat);
  }
  return map;
}

async function fetchLegacyArticle(
  legacyId: string,
  categoryMap: Map<string, string>,
): Promise<LegacyArticle | null> {
  const slug = legacyId.toLowerCase();
  if (!isValidSlug(slug)) {
    console.warn(`Invalid slug for legacy id ${legacyId}`);
    return null;
  }

  const html = await fetchText(`${LEGACY_BASE}/news/${legacyId}`);
  const jsonLd = parseJsonLdArticle(html);
  const bodyHtml = parseProseBody(html);
  const title =
    jsonLd?.headline?.trim() ||
    cheerio.load(html)("h1").first().text().trim() ||
    "Başlıksız haber";

  const excerpt = buildNewsExcerpt(
    bodyHtml,
    title,
    jsonLd?.description,
    480,
  );

  const category = categoryMap.get(slug) ?? "Haber";
  const publishedAt = jsonLd?.datePublished
    ? new Date(jsonLd.datePublished)
    : null;

  return {
    legacyId: slug,
    slug,
    title: title.slice(0, 500),
    excerpt: excerpt.slice(0, 2000),
    bodyHtml: bodyHtml || `<p>${excerpt}</p>`,
    category,
    tone: toneForCategory(category),
    coverImageUrl: firstImageUrl(jsonLd, bodyHtml),
    publishedAt:
      publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : null,
  };
}

async function uploadLegacyImage(
  db: ReturnType<typeof createDb>,
  config: ReturnType<typeof loadConfig>,
  adminId: string,
  imageUrl: string,
  cache: Map<string, string>,
): Promise<string | null> {
  const cached = cache.get(imageUrl);
  if (cached) return cached;

  const res = await fetch(imageUrl, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(45000),
  });
  if (!res.ok) {
    console.warn(`Image fetch failed (${res.status}): ${imageUrl}`);
    return null;
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  const result = await uploadMediaPublic(db, config, {
    buffer,
    filename: safeFilename(imageUrl),
    mimetype: guessMime(imageUrl, res.headers.get("content-type")),
    adminId,
  });

  if (!result.ok) {
    console.warn(`Image upload rejected: ${imageUrl}`);
    return null;
  }

  cache.set(imageUrl, result.row.id);
  return result.row.id;
}

async function rewriteInlineImages(
  bodyHtml: string,
  db: ReturnType<typeof createDb>,
  config: ReturnType<typeof loadConfig>,
  adminId: string,
  cache: Map<string, string>,
): Promise<string> {
  const $ = cheerio.load(bodyHtml, null, false);
  const { media: mediaTable } = await import("../db/schema/index.js");

  for (const img of $("img").toArray()) {
    const src = $(img).attr("src");
    if (!src) continue;
    const absolute = resolveLegacyUrl(src);
    const mediaId = await uploadLegacyImage(db, config, adminId, absolute, cache);
    if (!mediaId) continue;

    const [mediaRow] = await db
      .select({ publicUrl: mediaTable.publicUrl })
      .from(mediaTable)
      .where(eq(mediaTable.id, mediaId))
      .limit(1);
    if (mediaRow?.publicUrl) {
      $(img).attr("src", mediaRow.publicUrl);
    }
  }

  return $.root().html()?.trim() ?? bodyHtml;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!opts.all && (!opts.ids || opts.ids.length === 0)) {
    console.error(
      "Usage: npx tsx src/scripts/importLegacyNews.ts --ids=<id1,id2> | --all [--update] [--dry-run]",
    );
    process.exit(1);
  }

  const config = loadConfig();
  const pool = createPool(config);
  const db = createDb(pool);

  const [admin] = await db
    .select({ id: admins.id })
    .from(admins)
    .orderBy(asc(admins.createdAt))
    .limit(1);
  if (!admin) {
    console.error("No admin user found.");
    process.exit(1);
  }

  console.log("Building category map from legacy list pages…");
  const categoryMap = await buildCategoryMap();

  const legacyIds = opts.all
    ? await collectAllLegacyIds()
    : opts.ids!.map((id) => id.toLowerCase());

  const filteredIds = opts.haberOnly
    ? legacyIds.filter((id) => {
        const cat = categoryMap.get(id) ?? "Haber";
        return cat.toLowerCase() !== "duyuru";
      })
    : legacyIds;

  console.log(
    `Processing ${filteredIds.length} article(s)${opts.haberOnly ? " (Haber only)" : ""}…`,
  );

  const imageCache = new Map<string, string>();
  let created = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const legacyId of filteredIds) {
    try {
      const article = await fetchLegacyArticle(legacyId, categoryMap);
      if (!article) {
        failed += 1;
        continue;
      }

      const [existing] = await db
        .select({ id: news.id, slug: news.slug })
        .from(news)
        .where(eq(news.slug, article.slug))
        .limit(1);

      if (existing && !opts.update) {
        console.log(`Skip (exists): ${article.slug} — ${article.title}`);
        skipped += 1;
        continue;
      }

      if (opts.dryRun) {
        console.log(
          `[dry-run] ${existing ? "update" : "create"} ${article.slug}: ${article.title}`,
        );
        continue;
      }

      let coverImageId: string | null = null;
      if (article.coverImageUrl) {
        coverImageId = await uploadLegacyImage(
          db,
          config,
          admin.id,
          article.coverImageUrl,
          imageCache,
        );
      }

      const bodyHtml = await rewriteInlineImages(
        article.bodyHtml,
        db,
        config,
        admin.id,
        imageCache,
      );

      if (existing) {
        const result = await patchNews(db, existing.id, admin.id, {
          title: article.title,
          excerpt: article.excerpt,
          body: bodyHtml,
          category: article.category,
          tone: article.tone,
          coverImage: coverImageId,
        });
        if (!result.ok) {
          console.warn(`Patch failed (${result.code}): ${article.slug}`);
          failed += 1;
          continue;
        }
        if (article.publishedAt) {
          await db
            .update(news)
            .set({
              publishedAt: article.publishedAt,
              updatedBy: admin.id,
              updatedAt: new Date(),
            })
            .where(eq(news.id, existing.id));
        }
        console.log(`Updated: /haberler/${article.slug}`);
        updated += 1;
      } else {
        const result = await createNews(db, admin.id, {
          slug: article.slug,
          title: article.title,
          excerpt: article.excerpt,
          body: bodyHtml,
          category: article.category,
          tone: article.tone,
          coverImage: coverImageId,
        });
        if (!result.ok) {
          console.warn(`Create failed (${result.code}): ${article.slug}`);
          failed += 1;
          continue;
        }
        await db
          .update(news)
          .set({
            publishedAt: article.publishedAt ?? new Date(),
            updatedBy: admin.id,
            updatedAt: new Date(),
          })
          .where(eq(news.id, result.row.id));
        console.log(`Created: /haberler/${article.slug}`);
        created += 1;
      }
    } catch (err) {
      failed += 1;
      console.warn(`Failed ${legacyId}:`, err instanceof Error ? err.message : err);
    }
  }

  console.log(
    `\nDone. created=${created} updated=${updated} skipped=${skipped} failed=${failed}`,
  );

  if (!opts.dryRun && (created > 0 || updated > 0)) {
    let redis: Awaited<ReturnType<typeof connectRedis>> | null = null;
    if (config.redisUrl) {
      try {
        redis = await connectRedis(config.redisUrl);
        await bumpNewsCacheRevision(redis, config.redisPrefix);
      } catch (err) {
        console.warn("News cache revision bump failed:", err);
      } finally {
        redis?.disconnect();
      }
    }
  }

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
