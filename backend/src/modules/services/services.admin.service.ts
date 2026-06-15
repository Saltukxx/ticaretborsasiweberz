import {
  and,
  asc,
  count,
  eq,
  ilike,
  ne,
  type SQL,
} from "drizzle-orm";
import type { Database } from "../../db/connection.js";
import { sanitizeRichHtml } from "../../lib/sanitizeHtml.js";
import { services } from "../../db/schema/index.js";
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
    ? and(eq(services.slug, slug), ne(services.id, excludeId))
    : eq(services.slug, slug);
  const [row] = await db
    .select({ id: services.id })
    .from(services)
    .where(cond)
    .limit(1);
  return Boolean(row);
}

export async function listServicesAdmin(
  db: Database,
  params: {
    limit: number;
    offset: number;
    active: "all" | "true" | "false";
    q?: string;
  },
) {
  const term = params.q?.trim();
  const search: SQL | undefined = term
    ? ilike(services.title, `%${escapeLike(term)}%`)
    : undefined;

  const activeFilter: SQL | undefined =
    params.active === "all"
      ? undefined
      : eq(services.isActive, params.active === "true");

  const parts: SQL[] = [];
  if (search) parts.push(search);
  if (activeFilter) parts.push(activeFilter);

  const whereClause =
    parts.length === 0
      ? undefined
      : parts.length === 1
        ? parts[0]!
        : and(...parts);

  const countBase = db.select({ total: count() }).from(services);
  const [countRow] = await (whereClause
    ? countBase.where(whereClause)
    : countBase);

  const rowsBase = db.select().from(services);
  const rows = await (whereClause ? rowsBase.where(whereClause) : rowsBase)
    .orderBy(asc(services.sortOrder), asc(services.title))
    .limit(params.limit)
    .offset(params.offset);

  return { rows, total: Number(countRow?.total ?? 0) };
}

export async function getServiceByIdAdmin(db: Database, id: string) {
  const [row] = await db
    .select()
    .from(services)
    .where(eq(services.id, id))
    .limit(1);
  return row ?? null;
}

export type CreateServiceInput = {
  slug: string;
  title: string;
  description: string;
  icon?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};

export async function createService(
  db: Database,
  input: CreateServiceInput,
): Promise<
  | { ok: true; row: typeof services.$inferSelect }
  | { ok: false; code: "INVALID_SLUG" | "SLUG_TAKEN" }
> {
  if (!isValidSlug(input.slug)) return { ok: false, code: "INVALID_SLUG" };
  if (await slugTaken(db, input.slug)) return { ok: false, code: "SLUG_TAKEN" };

  const [row] = await db
    .insert(services)
    .values({
      slug: input.slug,
      title: input.title,
      description: sanitizeRichHtml(input.description),
      icon: input.icon ?? null,
      sortOrder: input.sortOrder ?? 0,
      isActive: input.isActive ?? true,
    })
    .returning();

  if (!row) throw new Error("insert service failed");
  return { ok: true, row };
}

export type PatchServiceInput = Partial<{
  slug: string;
  title: string;
  description: string;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
}>;

export async function patchService(
  db: Database,
  id: string,
  patch: PatchServiceInput,
): Promise<
  | { ok: true; row: typeof services.$inferSelect }
  | { ok: false; code: "NOT_FOUND" | "SLUG_TAKEN" | "INVALID_SLUG" }
> {
  const existing = await getServiceByIdAdmin(db, id);
  if (!existing) return { ok: false, code: "NOT_FOUND" };

  if (patch.slug !== undefined) {
    if (!isValidSlug(patch.slug)) return { ok: false, code: "INVALID_SLUG" };
    if (patch.slug !== existing.slug && (await slugTaken(db, patch.slug, id))) {
      return { ok: false, code: "SLUG_TAKEN" };
    }
  }

  const updates = stripUndefined(patch) as PatchServiceInput;
  if (updates.description !== undefined) {
    updates.description = sanitizeRichHtml(updates.description);
  }
  const [row] = await db
    .update(services)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(services.id, id))
    .returning();

  if (!row) return { ok: false, code: "NOT_FOUND" };
  return { ok: true, row };
}

export async function deleteService(db: Database, id: string) {
  const [row] = await db
    .delete(services)
    .where(eq(services.id, id))
    .returning({ id: services.id });
  return row ?? null;
}
