import { and, desc, eq, isNotNull, isNull } from "drizzle-orm";
import type { FastifyPluginAsync } from "fastify";
import type { Database } from "../../db/connection.js";
import { announcements } from "../../db/schema/announcements.js";
import { events } from "../../db/schema/events.js";
import { geographicalIndications } from "../../db/schema/geographicalIndications.js";
import { news } from "../../db/schema/news.js";
import { reports } from "../../db/schema/reports.js";
import { listPublishedLegalSlugs } from "../site/site.service.js";
import { STATIC_SEO_PATHS } from "./sitemap.paths.js";

function resolveSiteUrl(baseUrl?: string): string {
  const fromEnv = process.env.SITE_URL?.trim();
  const raw = fromEnv || baseUrl || "https://www.erzurumtb.org.tr";
  return raw.replace(/\/$/, "");
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlEntry(siteUrl: string, path: string, lastmod?: Date | string | null): string {
  const loc = path === "/" ? siteUrl : `${siteUrl}${path}`;
  const lastmodTag = lastmod
    ? `<lastmod>${new Date(lastmod).toISOString().slice(0, 10)}</lastmod>`
    : "";
  return `  <url><loc>${escapeXml(loc)}</loc>${lastmodTag}</url>`;
}

export async function buildSitemapXml(db: Database, siteUrl: string): Promise<string> {
  const [
    newsRows,
    announcementRows,
    reportRows,
    eventRows,
    geoRows,
    legalRows,
  ] = await Promise.all([
    db
      .select({ slug: news.slug, updatedAt: news.updatedAt })
      .from(news)
      .where(and(isNull(news.deletedAt), isNotNull(news.publishedAt)))
      .orderBy(desc(news.publishedAt)),
    db
      .select({ slug: announcements.slug, updatedAt: announcements.updatedAt })
      .from(announcements)
      .where(and(isNull(announcements.deletedAt), isNotNull(announcements.publishedAt)))
      .orderBy(desc(announcements.publishedAt)),
    db
      .select({ slug: reports.slug, updatedAt: reports.updatedAt })
      .from(reports)
      .where(and(isNull(reports.deletedAt), eq(reports.isPublished, true)))
      .orderBy(desc(reports.reportDate)),
    db
      .select({ slug: events.slug, updatedAt: events.updatedAt })
      .from(events)
      .where(and(isNull(events.deletedAt), eq(events.isPublished, true)))
      .orderBy(desc(events.startsAt)),
    db
      .select({
        slug: geographicalIndications.slug,
        updatedAt: geographicalIndications.updatedAt,
      })
      .from(geographicalIndications)
      .where(eq(geographicalIndications.isActive, true))
      .orderBy(desc(geographicalIndications.updatedAt)),
    listPublishedLegalSlugs(db),
  ]);

  const urls: string[] = [];

  for (const path of STATIC_SEO_PATHS) {
    urls.push(urlEntry(siteUrl, path));
  }

  for (const row of newsRows) {
    urls.push(urlEntry(siteUrl, `/haberler/${row.slug}`, row.updatedAt));
  }
  for (const row of announcementRows) {
    urls.push(urlEntry(siteUrl, `/duyurular/${row.slug}`, row.updatedAt));
  }
  for (const row of reportRows) {
    urls.push(urlEntry(siteUrl, `/raporlar/${row.slug}`, row.updatedAt));
  }
  for (const row of eventRows) {
    urls.push(urlEntry(siteUrl, `/etkinlikler/${row.slug}`, row.updatedAt));
  }
  for (const row of geoRows) {
    if (row.slug === "kadayif-dolmasi") continue;
    urls.push(urlEntry(siteUrl, `/cografi-isaretler/${row.slug}`, row.updatedAt));
  }
  for (const row of legalRows) {
    urls.push(urlEntry(siteUrl, `/yasal/${row.slug}`, row.updatedAt));
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
  ].join("\n");
}

export const sitemapPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.get("/sitemap.xml", async (_req, reply) => {
    const siteUrl = resolveSiteUrl(fastify.config.baseUrl);
    const xml = await buildSitemapXml(fastify.db, siteUrl);
    return reply.type("application/xml; charset=utf-8").send(xml);
  });
};
