import {
  and,
  count,
  desc,
  eq,
  gte,
  ilike,
  lt,
  isNotNull,
  isNull,
  ne,
  type SQL,
} from "drizzle-orm";
import type { Database } from "../../db/connection.js";
import { sanitizeOptionalRichHtml } from "../../lib/sanitizeHtml.js";
import { events } from "../../db/schema/index.js";
import { mediaExists } from "../../lib/media.js";
import { isValidSlug } from "../../lib/slug.js";

function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}

export type EventScope = "active" | "deleted" | "all";

function scopeFilter(scope: EventScope): SQL | undefined {
  switch (scope) {
    case "active":
      return isNull(events.deletedAt);
    case "deleted":
      return isNotNull(events.deletedAt);
    default:
      return undefined;
  }
}

function escapeLike(s: string): string {
  return s.replace(/[%_\\]/g, "\\$&");
}

export async function listEventsAdmin(
  db: Database,
  params: {
    limit: number;
    offset: number;
    scope: EventScope;
    q?: string;
  },
) {
  const scope = scopeFilter(params.scope);
  const term = params.q?.trim();
  const search: SQL | undefined = term
    ? ilike(events.title, `%${escapeLike(term)}%`)
    : undefined;
  const whereClause =
    scope && search ? and(scope, search) : scope ?? search;

  const countBase = db.select({ total: count() }).from(events);
  const [countRow] = await (whereClause
    ? countBase.where(whereClause)
    : countBase);

  const rowsBase = db.select().from(events);
  const rows = await (whereClause
    ? rowsBase.where(whereClause)
    : rowsBase
  )
    .orderBy(desc(events.startsAt))
    .limit(params.limit)
    .offset(params.offset);

  return { rows, total: Number(countRow?.total ?? 0) };
}

export async function getEventByIdAdmin(db: Database, id: string) {
  const [row] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  return row ?? null;
}

async function slugTaken(db: Database, slug: string, excludeId?: string) {
  const cond = excludeId
    ? and(eq(events.slug, slug), ne(events.id, excludeId))
    : eq(events.slug, slug);
  const [row] = await db
    .select({ id: events.id })
    .from(events)
    .where(cond)
    .limit(1);
  return Boolean(row);
}

export type CreateEventInput = {
  slug: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startsAt: Date;
  endsAt?: Date | null;
  coverImage?: string | null;
  registrationOpen?: boolean;
  isStakeholder?: boolean;
  statusLabel?: string | null;
  isPublished?: boolean;
};

export async function createEvent(
  db: Database,
  adminId: string,
  input: CreateEventInput,
): Promise<
  | { ok: true; row: typeof events.$inferSelect }
  | { ok: false; code: "INVALID_SLUG" | "SLUG_TAKEN" | "MEDIA_NOT_FOUND" }
> {
  if (!isValidSlug(input.slug)) return { ok: false, code: "INVALID_SLUG" };
  if (await slugTaken(db, input.slug)) return { ok: false, code: "SLUG_TAKEN" };
  if (input.coverImage && !(await mediaExists(db, input.coverImage))) {
    return { ok: false, code: "MEDIA_NOT_FOUND" };
  }

  const [row] = await db
    .insert(events)
    .values({
      slug: input.slug,
      title: input.title,
      description: sanitizeOptionalRichHtml(input.description) ?? null,
      location: input.location ?? null,
      startsAt: input.startsAt,
      endsAt: input.endsAt ?? null,
      coverImage: input.coverImage ?? null,
      registrationOpen: input.registrationOpen ?? false,
      isStakeholder: input.isStakeholder ?? false,
      statusLabel: input.statusLabel ?? null,
      isPublished: input.isPublished ?? false,
      createdBy: adminId,
      updatedBy: adminId,
    })
    .returning();

  if (!row) throw new Error("insert event failed");
  return { ok: true, row };
}

export type PatchEventInput = Partial<{
  slug: string;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: Date;
  endsAt: Date | null;
  coverImage: string | null;
  registrationOpen: boolean;
  isStakeholder: boolean;
  statusLabel: string | null;
  isPublished: boolean;
}>;

export async function patchEvent(
  db: Database,
  id: string,
  adminId: string,
  patch: PatchEventInput,
): Promise<
  | { ok: true; row: typeof events.$inferSelect }
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
  const existing = await getEventByIdAdmin(db, id);
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

  const updates = stripUndefined(patch) as PatchEventInput;
  if (updates.description !== undefined) {
    updates.description = sanitizeOptionalRichHtml(updates.description) ?? null;
  }
  const [row] = await db
    .update(events)
    .set({
      ...updates,
      updatedBy: adminId,
      updatedAt: new Date(),
    })
    .where(eq(events.id, id))
    .returning();

  if (!row) return { ok: false, code: "NOT_FOUND" };
  return { ok: true, row };
}

export async function publishEvent(
  db: Database,
  id: string,
  adminId: string,
): Promise<
  | { ok: true; row: typeof events.$inferSelect }
  | { ok: false; code: "NOT_FOUND" | "ARCHIVED" }
> {
  const existing = await getEventByIdAdmin(db, id);
  if (!existing) return { ok: false, code: "NOT_FOUND" };
  if (existing.deletedAt) return { ok: false, code: "ARCHIVED" };

  const now = new Date();
  const [row] = await db
    .update(events)
    .set({
      isPublished: true,
      updatedBy: adminId,
      updatedAt: now,
    })
    .where(eq(events.id, id))
    .returning();

  if (!row) return { ok: false, code: "NOT_FOUND" };
  return { ok: true, row };
}

export async function unpublishEvent(
  db: Database,
  id: string,
  adminId: string,
): Promise<
  | { ok: true; row: typeof events.$inferSelect }
  | { ok: false; code: "NOT_FOUND" | "ARCHIVED" }
> {
  const existing = await getEventByIdAdmin(db, id);
  if (!existing) return { ok: false, code: "NOT_FOUND" };
  if (existing.deletedAt) return { ok: false, code: "ARCHIVED" };

  const now = new Date();
  const [row] = await db
    .update(events)
    .set({
      isPublished: false,
      updatedBy: adminId,
      updatedAt: now,
    })
    .where(eq(events.id, id))
    .returning();

  if (!row) return { ok: false, code: "NOT_FOUND" };
  return { ok: true, row };
}

export async function softDeleteEvent(
  db: Database,
  id: string,
  adminId: string,
): Promise<
  | { ok: true; row: typeof events.$inferSelect }
  | { ok: false; code: "NOT_FOUND" | "ALREADY_DELETED" }
> {
  const existing = await getEventByIdAdmin(db, id);
  if (!existing) return { ok: false, code: "NOT_FOUND" };
  if (existing.deletedAt) return { ok: false, code: "ALREADY_DELETED" };

  const now = new Date();
  const [row] = await db
    .update(events)
    .set({
      deletedAt: now,
      updatedBy: adminId,
      updatedAt: now,
    })
    .where(eq(events.id, id))
    .returning();

  if (!row) return { ok: false, code: "NOT_FOUND" };
  return { ok: true, row };
}

export async function hardDeleteEvent(db: Database, id: string) {
  const [row] = await db
    .delete(events)
    .where(eq(events.id, id))
    .returning({ id: events.id });
  return row ?? null;
}

/** Public: published, not deleted */
export function publishedPublicEventWhere() {
  return and(isNull(events.deletedAt), eq(events.isPublished, true));
}

/** Public: published, not deleted, starts_at >= now */
export function upcomingPublicEventWhere(now: Date = new Date()) {
  return and(publishedPublicEventWhere(), gte(events.startsAt, now));
}

export type PublicEventWhen = "all" | "upcoming" | "past";

export function publicEventWhenFilter(
  when: PublicEventWhen,
  now: Date = new Date(),
): SQL | undefined {
  const base = publishedPublicEventWhere();
  if (when === "upcoming") return and(base, gte(events.startsAt, now));
  if (when === "past") return and(base, lt(events.startsAt, now));
  return base;
}
