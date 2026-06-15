/**
 * Import announcements (type=duyuru) from legacy erzurumtb.org.tr into announcements table.
 *
 * Run:
 *   npx tsx src/scripts/importLegacyAnnouncements.ts --all
 *   npx tsx src/scripts/importLegacyAnnouncements.ts --ids=6853d8e33dbb646b66421fc2
 *   npx tsx src/scripts/importLegacyAnnouncements.ts --all --update --dry-run
 */
import { extname } from "node:path";
import * as cheerio from "cheerio";
import { asc, eq } from "drizzle-orm";
import { createPool, createDb } from "../db/connection.js";
import { loadConfig } from "../config.js";
import { admins, announcements, media } from "../db/schema/index.js";
import { uploadMediaPublic } from "../modules/media/media.admin.service.js";
import {
  createAnnouncement,
  patchAnnouncement,
} from "../modules/announcements/announcements.admin.service.js";
import { isValidSlug } from "../lib/slug.js";

const LEGACY_BASE = "https://www.erzurumtb.org.tr";
const LEGACY_LIST = `${LEGACY_BASE}/news?type=duyuru`;
const USER_AGENT = "ETB-Legacy-Announcements-Import/1.0";
const MAX_LIST_PAGES = 20;

type JsonLdArticle = {
  headline?: string;
  description?: string;
  datePublished?: string;
};

type LegacyAnnouncement = {
  legacyId: string;
  slug: string;
  title: string;
  bodyHtml: string;
  publishedAt: Date | null;
};

type CliOptions = {
  ids: string[] | null;
  all: boolean;
  update: boolean;
  dryRun: boolean;
};

function parseArgs(argv: string[]): CliOptions {
  let ids: string[] | null = null;
  let all = false;
  let update = false;
  let dryRun = false;

  for (const arg of argv) {
    if (arg === "--all") all = true;
    else if (arg === "--update") update = true;
    else if (arg === "--dry-run") dryRun = true;
    else if (arg.startsWith("--ids=")) {
      ids = arg
        .slice("--ids=".length)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  return { ids, all, update, dryRun };
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

function decodeEntities(value: string): string {
  return cheerio.load(`<div>${value}</div>`, null, false)("div").text().trim();
}

function stripHtml(html: string): string {
  return cheerio.load(html).text().replace(/\s+/g, " ").trim();
}

function normalizeBodyHtml(html: string): string {
  return html
    .replace(/(&nbsp;|\u00a0)+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
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
  return normalizeBodyHtml(article.html()?.trim() ?? "");
}

async function collectLegacyDuyuruIds(): Promise<string[]> {
  const ids = new Set<string>();

  for (let page = 1; page <= MAX_LIST_PAGES; page += 1) {
    const html = await fetchText(`${LEGACY_LIST}&page=${page}`);
    let found = 0;
    const re = /\/news\/([a-f0-9]{24})/gi;
    let match: RegExpExecArray | null;
    while ((match = re.exec(html)) !== null) {
      ids.add(match[1]!.toLowerCase());
      found += 1;
    }
    if (found === 0) break;
  }

  return [...ids];
}

async function fetchLegacyAnnouncement(legacyId: string): Promise<LegacyAnnouncement | null> {
  const slug = legacyId.toLowerCase();
  if (!isValidSlug(slug)) {
    console.warn(`Invalid slug for legacy id ${legacyId}`);
    return null;
  }

  const html = await fetchText(`${LEGACY_BASE}/news/${legacyId}`);
  const jsonLd = parseJsonLdArticle(html);
  const bodyHtml = parseProseBody(html);
  const titleRaw =
    jsonLd?.headline?.trim() ||
    cheerio.load(html)("h1").first().text().trim() ||
    "Başlıksız duyuru";
  const title = decodeEntities(titleRaw).slice(0, 500);

  const fallbackBody =
    jsonLd?.description?.trim() ||
    stripHtml(bodyHtml) ||
    title;

  const publishedAt = jsonLd?.datePublished
    ? new Date(jsonLd.datePublished)
    : null;

  return {
    legacyId: slug,
    slug,
    title,
    bodyHtml: bodyHtml || `<p>${decodeEntities(fallbackBody)}</p>`,
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

  for (const img of $("img").toArray()) {
    const src = $(img).attr("src");
    if (!src) continue;
    const absolute = resolveLegacyUrl(src);
    const mediaId = await uploadLegacyImage(db, config, adminId, absolute, cache);
    if (!mediaId) continue;

    const [mediaRow] = await db
      .select({ publicUrl: media.publicUrl })
      .from(media)
      .where(eq(media.id, mediaId))
      .limit(1);
    if (mediaRow?.publicUrl) {
      $(img).attr("src", mediaRow.publicUrl);
    }
  }

  for (const anchor of $("a[href]").toArray()) {
    const href = $(anchor).attr("href");
    if (!href || href.startsWith("http") || href.startsWith("mailto:")) continue;
    $(anchor).attr("href", resolveLegacyUrl(href));
  }

  return normalizeBodyHtml($.root().html()?.trim() ?? bodyHtml);
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!opts.all && (!opts.ids || opts.ids.length === 0)) {
    console.error(
      "Usage: npx tsx src/scripts/importLegacyAnnouncements.ts --ids=<id1,id2> | --all [--update] [--dry-run]",
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

  const legacyIds = opts.all
    ? await collectLegacyDuyuruIds()
    : opts.ids!.map((id) => id.toLowerCase());

  console.log(`Processing ${legacyIds.length} announcement(s) from legacy duyuru list…`);

  const imageCache = new Map<string, string>();
  let created = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const legacyId of legacyIds) {
    try {
      const item = await fetchLegacyAnnouncement(legacyId);
      if (!item) {
        failed += 1;
        continue;
      }

      const [existing] = await db
        .select({ id: announcements.id })
        .from(announcements)
        .where(eq(announcements.slug, item.slug))
        .limit(1);

      if (existing && !opts.update) {
        console.log(`Skip (exists): ${item.slug} — ${item.title}`);
        skipped += 1;
        continue;
      }

      if (opts.dryRun) {
        console.log(
          `[dry-run] ${existing ? "update" : "create"} ${item.slug}: ${item.title}`,
        );
        continue;
      }

      const bodyHtml = await rewriteInlineImages(
        item.bodyHtml,
        db,
        config,
        admin.id,
        imageCache,
      );

      if (existing) {
        const result = await patchAnnouncement(db, existing.id, admin.id, {
          title: item.title,
          body: bodyHtml,
        });
        if (!result.ok) {
          console.warn(`Patch failed (${result.code}): ${item.slug}`);
          failed += 1;
          continue;
        }
        if (item.publishedAt) {
          await db
            .update(announcements)
            .set({
              publishedAt: item.publishedAt,
              updatedBy: admin.id,
              updatedAt: new Date(),
            })
            .where(eq(announcements.id, existing.id));
        }
        console.log(`Updated: /duyurular/${item.slug}`);
        updated += 1;
      } else {
        const result = await createAnnouncement(db, admin.id, {
          slug: item.slug,
          title: item.title,
          body: bodyHtml,
          isTicker: false,
          priority: 0,
        });
        if (!result.ok) {
          console.warn(`Create failed (${result.code}): ${item.slug}`);
          failed += 1;
          continue;
        }
        await db
          .update(announcements)
          .set({
            publishedAt: item.publishedAt ?? new Date(),
            updatedBy: admin.id,
            updatedAt: new Date(),
          })
          .where(eq(announcements.id, result.row.id));
        console.log(`Created: /duyurular/${item.slug}`);
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
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
