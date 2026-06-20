import {
  and,
  desc,
  isNotNull,
  isNull,
} from "drizzle-orm";
import type { Database } from "../../db/connection.js";
import { announcements, events, news } from "../../db/schema/index.js";
import { activeAnnouncementWhere } from "../announcements/announcements.filters.js";
import {
  upcomingPublicEventWhere,
} from "../events/events.admin.service.js";

function truncateText(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

export type SiteChatCmsContext = {
  fetchedAt: string;
  news: Array<{
    slug: string;
    title: string;
    excerpt: string | null;
    category: string;
    publishedAt: string | null;
    url: string;
  }>;
  announcements: Array<{
    slug: string;
    title: string;
    summary: string;
    publishedAt: string | null;
    url: string;
  }>;
  events: Array<{
    slug: string;
    title: string;
    description: string | null;
    location: string | null;
    startsAt: string | null;
    url: string;
  }>;
};

export async function fetchSiteChatCmsContext(
  db: Database,
): Promise<SiteChatCmsContext> {
  const now = new Date();

  const [newsRows, annRows, eventRows] = await Promise.all([
    db
      .select({
        slug: news.slug,
        title: news.title,
        excerpt: news.excerpt,
        category: news.category,
        publishedAt: news.publishedAt,
      })
      .from(news)
      .where(and(isNull(news.deletedAt), isNotNull(news.publishedAt)))
      .orderBy(desc(news.publishedAt))
      .limit(10),
    db
      .select({
        slug: announcements.slug,
        title: announcements.title,
        body: announcements.body,
        publishedAt: announcements.publishedAt,
      })
      .from(announcements)
      .where(activeAnnouncementWhere(now))
      .orderBy(desc(announcements.priority), desc(announcements.publishedAt))
      .limit(8),
    db
      .select({
        slug: events.slug,
        title: events.title,
        description: events.description,
        location: events.location,
        startsAt: events.startsAt,
      })
      .from(events)
      .where(upcomingPublicEventWhere(now))
      .orderBy(events.startsAt)
      .limit(8),
  ]);

  return {
    fetchedAt: now.toISOString(),
    news: newsRows.map((r) => ({
      slug: r.slug,
      title: r.title,
      excerpt: r.excerpt,
      category: r.category,
      publishedAt: r.publishedAt?.toISOString() ?? null,
      url: `/haberler/${r.slug}`,
    })),
    announcements: annRows.map((r) => ({
      slug: r.slug,
      title: r.title,
      summary: truncateText(r.body ?? "", 280),
      publishedAt: r.publishedAt?.toISOString() ?? null,
      url: `/duyurular/${r.slug}`,
    })),
    events: eventRows.map((r) => ({
      slug: r.slug,
      title: r.title,
      description: r.description ? truncateText(r.description, 200) : null,
      location: r.location,
      startsAt: r.startsAt?.toISOString() ?? null,
      url: `/etkinlikler/${r.slug}`,
    })),
  };
}
