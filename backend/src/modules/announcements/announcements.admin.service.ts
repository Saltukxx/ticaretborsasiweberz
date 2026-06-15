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
import { announcements } from "../../db/schema/index.js";
import { sanitizeRichHtml } from "../../lib/sanitizeHtml.js";
import { isValidSlug } from "../../lib/slug.js";

function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}

export type AnnouncementScope = "active" | "deleted" | "all";

function scopeFilter(scope: AnnouncementScope): SQL | undefined {
  switch (scope) {
    case "active":
      return isNull(announcements.deletedAt);
    case "deleted":
      return isNotNull(announcements.deletedAt);
    default:
      return undefined;
  }
}

function escapeLike(s: string): string {
  return s.replace(/[%_\\]/g, "\\$&");
}

async function slugTaken(
  db: Database,
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  const cond = excludeId
    ? and(eq(announcements.slug, slug), ne(announcements.id, excludeId))
    : eq(announcements.slug, slug);
  const [row] = await db
    .select({ id: announcements.id })
    .from(announcements)
    .where(cond)
    .limit(1);
  return Boolean(row);
}

export async function listAnnouncementsAdmin(
  db: Database,
  params: {
    limit: number;
    offset: number;
    scope: AnnouncementScope;
    q?: string;
  },
) {
  const scope = scopeFilter(params.scope);
  const term = params.q?.trim();
  const search: SQL | undefined = term
    ? ilike(announcements.title, `%${escapeLike(term)}%`)
    : undefined;
  const whereClause = scope && search ? and(scope, search) : scope ?? search;

  const countBase = db.select({ total: count() }).from(announcements);
  const [countRow] = await (whereClause
    ? countBase.where(whereClause)
    : countBase);

  const rowsBase = db.select().from(announcements);
  const rows = await (whereClause
    ? rowsBase.where(whereClause)
    : rowsBase
  )
    .orderBy(desc(announcements.updatedAt))
    .limit(params.limit)
    .offset(params.offset);

  return { rows, total: Number(countRow?.total ?? 0) };
}

export async function getAnnouncementByIdAdmin(db: Database, id: string) {
  const [row] = await db
    .select()
    .from(announcements)
    .where(eq(announcements.id, id))
    .limit(1);
  return row ?? null;
}

export type CreateAnnouncementInput = {
  slug: string;
  title: string;
  body: string;
  isTicker?: boolean;
  priority?: number;
  expiresAt?: Date | null;
};

export async function createAnnouncement(
  db: Database,
  adminId: string,
  input: CreateAnnouncementInput,
): Promise<
  | { ok: true; row: typeof announcements.$inferSelect }
  | { ok: false; code: "SLUG_TAKEN" | "INVALID_SLUG" }
> {
  if (!isValidSlug(input.slug)) return { ok: false, code: "INVALID_SLUG" };
  if (await slugTaken(db, input.slug)) return { ok: false, code: "SLUG_TAKEN" };

  const [row] = await db
    .insert(announcements)
    .values({
      slug: input.slug,
      title: input.title,
      body: sanitizeRichHtml(input.body),
      isTicker: input.isTicker ?? false,
      priority: input.priority ?? 0,
      expiresAt: input.expiresAt ?? null,
      createdBy: adminId,
      updatedBy: adminId,
    })
    .returning();

  if (!row) throw new Error("insert announcement: returning empty row");
  return { ok: true, row };
}

export type PatchAnnouncementInput = Partial<{
  slug: string;
  title: string;
  body: string;
  isTicker: boolean;
  priority: number;
  expiresAt: Date | null;
}>;

export async function patchAnnouncement(
  db: Database,
  id: string,
  adminId: string,
  patch: PatchAnnouncementInput,
): Promise<
  | { ok: true; row: typeof announcements.$inferSelect }
  | { ok: false; code: "NOT_FOUND" | "ARCHIVED" | "SLUG_TAKEN" | "INVALID_SLUG" }
> {
  const existing = await getAnnouncementByIdAdmin(db, id);
  if (!existing) return { ok: false, code: "NOT_FOUND" };
  if (existing.deletedAt) return { ok: false, code: "ARCHIVED" };

  if (patch.slug !== undefined) {
    if (!isValidSlug(patch.slug)) return { ok: false, code: "INVALID_SLUG" };
    if (
      patch.slug !== existing.slug &&
      (await slugTaken(db, patch.slug, id))
    ) {
      return { ok: false, code: "SLUG_TAKEN" };
    }
  }

  const updates = stripUndefined(patch) as PatchAnnouncementInput;
  if (updates.body !== undefined) {
    updates.body = sanitizeRichHtml(updates.body);
  }
  const [row] = await db
    .update(announcements)
    .set({
      ...updates,
      updatedBy: adminId,
      updatedAt: new Date(),
    })
    .where(eq(announcements.id, id))
    .returning();

  if (!row) return { ok: false, code: "NOT_FOUND" };
  return { ok: true, row };
}

export async function publishAnnouncement(
  db: Database,
  id: string,
  adminId: string,
): Promise<
  | { ok: true; row: typeof announcements.$inferSelect }
  | { ok: false; code: "NOT_FOUND" | "ARCHIVED" }
> {
  const existing = await getAnnouncementByIdAdmin(db, id);
  if (!existing) return { ok: false, code: "NOT_FOUND" };
  if (existing.deletedAt) return { ok: false, code: "ARCHIVED" };

  const now = new Date();
  const [row] = await db
    .update(announcements)
    .set({
      publishedAt: now,
      updatedBy: adminId,
      updatedAt: now,
    })
    .where(eq(announcements.id, id))
    .returning();

  if (!row) return { ok: false, code: "NOT_FOUND" };
  return { ok: true, row };
}

export async function unpublishAnnouncement(
  db: Database,
  id: string,
  adminId: string,
): Promise<
  | { ok: true; row: typeof announcements.$inferSelect }
  | { ok: false; code: "NOT_FOUND" | "ARCHIVED" }
> {
  const existing = await getAnnouncementByIdAdmin(db, id);
  if (!existing) return { ok: false, code: "NOT_FOUND" };
  if (existing.deletedAt) return { ok: false, code: "ARCHIVED" };

  const now = new Date();
  const [row] = await db
    .update(announcements)
    .set({
      publishedAt: null,
      updatedBy: adminId,
      updatedAt: now,
    })
    .where(eq(announcements.id, id))
    .returning();

  if (!row) return { ok: false, code: "NOT_FOUND" };
  return { ok: true, row };
}

export async function softDeleteAnnouncement(
  db: Database,
  id: string,
  adminId: string,
): Promise<
  | { ok: true; row: typeof announcements.$inferSelect }
  | { ok: false; code: "NOT_FOUND" | "ALREADY_DELETED" }
> {
  const existing = await getAnnouncementByIdAdmin(db, id);
  if (!existing) return { ok: false, code: "NOT_FOUND" };
  if (existing.deletedAt) return { ok: false, code: "ALREADY_DELETED" };

  const now = new Date();
  const [row] = await db
    .update(announcements)
    .set({
      deletedAt: now,
      updatedBy: adminId,
      updatedAt: now,
    })
    .where(eq(announcements.id, id))
    .returning();

  if (!row) return { ok: false, code: "NOT_FOUND" };
  return { ok: true, row };
}

export async function hardDeleteAnnouncement(db: Database, id: string) {
  const deleted = await db
    .delete(announcements)
    .where(eq(announcements.id, id))
    .returning({ id: announcements.id });
  return deleted[0] ?? null;
}
