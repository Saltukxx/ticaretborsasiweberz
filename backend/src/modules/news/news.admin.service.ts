import {
  and,
  count,
  desc,
  eq,
  ilike,
  isNotNull,
  isNull,
  ne,
  type SQL,
} from "drizzle-orm";
import type { Database } from "../../db/connection.js";
import { news } from "../../db/schema/index.js";
import { mediaExists } from "../../lib/media.js";
import { sanitizeRichHtml } from "../../lib/sanitizeHtml.js";
import { isValidSlug } from "../../lib/slug.js";

function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}

export type NewsScope = "active" | "deleted" | "all";

function scopeFilter(scope: NewsScope): SQL | undefined {
  switch (scope) {
    case "active":
      return isNull(news.deletedAt);
    case "deleted":
      return isNotNull(news.deletedAt);
    default:
      return undefined;
  }
}

function escapeLike(s: string): string {
  return s.replace(/[%_\\]/g, "\\$&");
}

export async function listNewsAdmin(
  db: Database,
  params: {
    limit: number;
    offset: number;
    scope: NewsScope;
    q?: string;
  },
) {
  const scope = scopeFilter(params.scope);
  const term = params.q?.trim();
  const search: SQL | undefined = term
    ? ilike(news.title, `%${escapeLike(term)}%`)
    : undefined;

  const whereClause =
    scope && search ? and(scope, search) : scope ?? search;

  const countBase = db.select({ total: count() }).from(news);
  const [countRow] = await (whereClause
    ? countBase.where(whereClause)
    : countBase);

  const rowsBase = db.select().from(news);
  const rows = await (whereClause
    ? rowsBase.where(whereClause)
    : rowsBase
  )
    .orderBy(desc(news.updatedAt))
    .limit(params.limit)
    .offset(params.offset);

  return {
    rows,
    total: Number(countRow?.total ?? 0),
  };
}

export async function getNewsByIdAdmin(db: Database, id: string) {
  const [row] = await db.select().from(news).where(eq(news.id, id)).limit(1);
  return row ?? null;
}

async function slugTaken(db: Database, slug: string, excludeId?: string) {
  const cond = excludeId
    ? and(eq(news.slug, slug), ne(news.id, excludeId))
    : eq(news.slug, slug);
  const [row] = await db
    .select({ id: news.id })
    .from(news)
    .where(cond)
    .limit(1);
  return Boolean(row);
}

export type CreateNewsInput = {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  tone: string;
  isFeatured?: boolean;
  coverImage?: string | null;
};

export async function createNews(
  db: Database,
  adminId: string,
  input: CreateNewsInput,
): Promise<
  | { ok: true; row: typeof news.$inferSelect }
  | { ok: false; code: "SLUG_TAKEN" | "INVALID_SLUG" | "MEDIA_NOT_FOUND" }
> {
  if (!isValidSlug(input.slug)) return { ok: false, code: "INVALID_SLUG" };
  if (await slugTaken(db, input.slug)) return { ok: false, code: "SLUG_TAKEN" };
  if (input.coverImage && !(await mediaExists(db, input.coverImage))) {
    return { ok: false, code: "MEDIA_NOT_FOUND" };
  }

  const [row] = await db
    .insert(news)
    .values({
      slug: input.slug,
      title: input.title,
      excerpt: sanitizeRichHtml(input.excerpt),
      body: sanitizeRichHtml(input.body),
      category: input.category,
      tone: input.tone,
      isFeatured: input.isFeatured ?? false,
      coverImage: input.coverImage ?? null,
      createdBy: adminId,
      updatedBy: adminId,
    })
    .returning();

  if (!row) {
    throw new Error("insert news: returning empty row");
  }
  return { ok: true, row };
}

export type PatchNewsInput = Partial<{
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  tone: string;
  isFeatured: boolean;
  coverImage: string | null;
}>;

export async function patchNews(
  db: Database,
  id: string,
  adminId: string,
  patch: PatchNewsInput,
): Promise<
  | { ok: true; row: typeof news.$inferSelect }
  | {
      ok: false;
      code:
        | "NOT_FOUND"
        | "ARCHIVED"
        | "SLUG_TAKEN"
        | "INVALID_SLUG"
        | "MEDIA_NOT_FOUND";
    }
> {
  const existing = await getNewsByIdAdmin(db, id);
  if (!existing) return { ok: false, code: "NOT_FOUND" };
  if (existing.deletedAt) return { ok: false, code: "ARCHIVED" };

  if (patch.slug !== undefined) {
    if (!isValidSlug(patch.slug)) return { ok: false, code: "INVALID_SLUG" };
    if (patch.slug !== existing.slug && (await slugTaken(db, patch.slug, id))) {
      return { ok: false, code: "SLUG_TAKEN" };
    }
  }

  if (patch.coverImage) {
    if (!(await mediaExists(db, patch.coverImage))) {
      return { ok: false, code: "MEDIA_NOT_FOUND" };
    }
  }

  const updates = stripUndefined(patch) as PatchNewsInput;
  if (updates.excerpt !== undefined) {
    updates.excerpt = sanitizeRichHtml(updates.excerpt);
  }
  if (updates.body !== undefined) {
    updates.body = sanitizeRichHtml(updates.body);
  }
  const [row] = await db
    .update(news)
    .set({
      ...updates,
      updatedBy: adminId,
      updatedAt: new Date(),
    })
    .where(eq(news.id, id))
    .returning();

  if (!row) return { ok: false, code: "NOT_FOUND" };
  return { ok: true, row };
}

export async function publishNews(
  db: Database,
  id: string,
  adminId: string,
): Promise<
  | { ok: true; row: typeof news.$inferSelect }
  | { ok: false; code: "NOT_FOUND" | "ARCHIVED" }
> {
  const existing = await getNewsByIdAdmin(db, id);
  if (!existing) return { ok: false, code: "NOT_FOUND" };
  if (existing.deletedAt) return { ok: false, code: "ARCHIVED" };

  const now = new Date();
  const [row] = await db
    .update(news)
    .set({
      publishedAt: now,
      updatedBy: adminId,
      updatedAt: now,
    })
    .where(eq(news.id, id))
    .returning();

  if (!row) return { ok: false, code: "NOT_FOUND" };
  return { ok: true, row };
}

export async function unpublishNews(
  db: Database,
  id: string,
  adminId: string,
): Promise<
  | { ok: true; row: typeof news.$inferSelect }
  | { ok: false; code: "NOT_FOUND" | "ARCHIVED" }
> {
  const existing = await getNewsByIdAdmin(db, id);
  if (!existing) return { ok: false, code: "NOT_FOUND" };
  if (existing.deletedAt) return { ok: false, code: "ARCHIVED" };

  const now = new Date();
  const [row] = await db
    .update(news)
    .set({
      publishedAt: null,
      updatedBy: adminId,
      updatedAt: now,
    })
    .where(eq(news.id, id))
    .returning();

  if (!row) return { ok: false, code: "NOT_FOUND" };
  return { ok: true, row };
}

export async function softDeleteNews(
  db: Database,
  id: string,
  adminId: string,
): Promise<
  | { ok: true; row: typeof news.$inferSelect }
  | { ok: false; code: "NOT_FOUND" | "ALREADY_DELETED" }
> {
  const existing = await getNewsByIdAdmin(db, id);
  if (!existing) return { ok: false, code: "NOT_FOUND" };
  if (existing.deletedAt) return { ok: false, code: "ALREADY_DELETED" };

  const now = new Date();
  const [row] = await db
    .update(news)
    .set({
      deletedAt: now,
      updatedBy: adminId,
      updatedAt: now,
    })
    .where(eq(news.id, id))
    .returning();

  if (!row) return { ok: false, code: "NOT_FOUND" };
  return { ok: true, row };
}

export async function hardDeleteNews(db: Database, id: string) {
  const deleted = await db.delete(news).where(eq(news.id, id)).returning({
    id: news.id,
  });
  return deleted[0] ?? null;
}
