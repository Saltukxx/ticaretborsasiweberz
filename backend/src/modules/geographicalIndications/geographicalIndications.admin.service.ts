import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  ne,
  type SQL,
} from "drizzle-orm";
import type { Database } from "../../db/connection.js";
import { sanitizeOptionalRichHtml } from "../../lib/sanitizeHtml.js";
import { geographicalIndications } from "../../db/schema/index.js";
import { mediaExists } from "../../lib/media.js";
import { isValidSlug } from "../../lib/slug.js";

function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}

function escapeLike(s: string): string {
  return s.replace(/[%_\\]/g, "\\$&");
}

async function slugTaken(db: Database, slug: string, excludeId?: string) {
  const cond = excludeId
    ? and(
        eq(geographicalIndications.slug, slug),
        ne(geographicalIndications.id, excludeId),
      )
    : eq(geographicalIndications.slug, slug);
  const [row] = await db
    .select({ id: geographicalIndications.id })
    .from(geographicalIndications)
    .where(cond)
    .limit(1);
  return Boolean(row);
}

export async function listGeoAdmin(
  db: Database,
  params: {
    limit: number;
    offset: number;
    active: "all" | "true" | "false";
    category?: string;
    q?: string;
  },
) {
  const term = params.q?.trim();
  const search: SQL | undefined = term
    ? ilike(geographicalIndications.name, `%${escapeLike(term)}%`)
    : undefined;

  const activeFilter: SQL | undefined =
    params.active === "all"
      ? undefined
      : eq(
          geographicalIndications.isActive,
          params.active === "true",
        );

  const catFilter: SQL | undefined = params.category
    ? eq(geographicalIndications.category, params.category)
    : undefined;

  const parts: SQL[] = [];
  if (search) parts.push(search);
  if (activeFilter) parts.push(activeFilter);
  if (catFilter) parts.push(catFilter);

  const whereClause =
    parts.length === 0
      ? undefined
      : parts.length === 1
        ? parts[0]!
        : and(...parts);

  const countBase = db.select({ total: count() }).from(geographicalIndications);
  const [countRow] = await (whereClause
    ? countBase.where(whereClause)
    : countBase);

  const rowsBase = db.select().from(geographicalIndications);
  const rows = await (whereClause ? rowsBase.where(whereClause) : rowsBase)
    .orderBy(
      desc(geographicalIndications.isHighlight),
      asc(geographicalIndications.sortOrder),
      asc(geographicalIndications.name),
    )
    .limit(params.limit)
    .offset(params.offset);

  return { rows, total: Number(countRow?.total ?? 0) };
}

export async function getGeoByIdAdmin(db: Database, id: string) {
  const [row] = await db
    .select()
    .from(geographicalIndications)
    .where(eq(geographicalIndications.id, id))
    .limit(1);
  return row ?? null;
}

export type CreateGeoInput = {
  slug: string;
  name: string;
  category: string;
  type: string;
  registrationNo?: string | null;
  registeredAt?: string | null;
  district?: string | null;
  isHighlight?: boolean;
  story?: string | null;
  coverImage?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};

export async function createGeo(
  db: Database,
  input: CreateGeoInput,
): Promise<
  | { ok: true; row: typeof geographicalIndications.$inferSelect }
  | { ok: false; code: "INVALID_SLUG" | "SLUG_TAKEN" | "MEDIA_NOT_FOUND" }
> {
  if (!isValidSlug(input.slug)) return { ok: false, code: "INVALID_SLUG" };
  if (await slugTaken(db, input.slug)) return { ok: false, code: "SLUG_TAKEN" };
  if (input.coverImage && !(await mediaExists(db, input.coverImage))) {
    return { ok: false, code: "MEDIA_NOT_FOUND" };
  }

  const [row] = await db
    .insert(geographicalIndications)
    .values({
      slug: input.slug,
      name: input.name,
      category: input.category,
      type: input.type,
      registrationNo: input.registrationNo ?? null,
      registeredAt: input.registeredAt ?? null,
      district: input.district ?? null,
      isHighlight: input.isHighlight ?? false,
      story: sanitizeOptionalRichHtml(input.story) ?? null,
      coverImage: input.coverImage ?? null,
      sortOrder: input.sortOrder ?? 0,
      isActive: input.isActive ?? true,
    })
    .returning();

  if (!row) throw new Error("insert geo indication failed");
  return { ok: true, row };
}

export type PatchGeoInput = Partial<{
  slug: string;
  name: string;
  category: string;
  type: string;
  registrationNo: string | null;
  registeredAt: string | null;
  district: string | null;
  isHighlight: boolean;
  story: string | null;
  coverImage: string | null;
  sortOrder: number;
  isActive: boolean;
}>;

export async function patchGeo(
  db: Database,
  id: string,
  patch: PatchGeoInput,
): Promise<
  | { ok: true; row: typeof geographicalIndications.$inferSelect }
  | {
      ok: false;
      code: "NOT_FOUND" | "SLUG_TAKEN" | "INVALID_SLUG" | "MEDIA_NOT_FOUND";
    }
> {
  const existing = await getGeoByIdAdmin(db, id);
  if (!existing) return { ok: false, code: "NOT_FOUND" };

  if (patch.slug !== undefined) {
    if (!isValidSlug(patch.slug)) return { ok: false, code: "INVALID_SLUG" };
    if (
      patch.slug !== existing.slug &&
      (await slugTaken(db, patch.slug, id))
    ) {
      return { ok: false, code: "SLUG_TAKEN" };
    }
  }
  if (patch.coverImage) {
    if (!(await mediaExists(db, patch.coverImage))) {
      return { ok: false, code: "MEDIA_NOT_FOUND" };
    }
  }

  const updates = stripUndefined(patch) as PatchGeoInput;
  if (updates.story !== undefined) {
    updates.story = sanitizeOptionalRichHtml(updates.story) ?? null;
  }
  const [row] = await db
    .update(geographicalIndications)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(geographicalIndications.id, id))
    .returning();

  if (!row) return { ok: false, code: "NOT_FOUND" };
  return { ok: true, row };
}

export async function deleteGeo(db: Database, id: string) {
  const [row] = await db
    .delete(geographicalIndications)
    .where(eq(geographicalIndications.id, id))
    .returning({ id: geographicalIndications.id });
  return row ?? null;
}
