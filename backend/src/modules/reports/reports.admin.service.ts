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
import { reports } from "../../db/schema/index.js";
import { pdfMediaExists } from "../../lib/media.js";
import { isValidSlug } from "../../lib/slug.js";

function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}

export type ReportScope = "active" | "deleted" | "all";

function scopeFilter(scope: ReportScope): SQL | undefined {
  switch (scope) {
    case "active":
      return isNull(reports.deletedAt);
    case "deleted":
      return isNotNull(reports.deletedAt);
    default:
      return undefined;
  }
}

function escapeLike(s: string): string {
  return s.replace(/[%_\\]/g, "\\$&");
}

export async function listReportsAdmin(
  db: Database,
  params: {
    limit: number;
    offset: number;
    scope: ReportScope;
    type?: string;
    q?: string;
  },
) {
  const scope = scopeFilter(params.scope);
  const term = params.q?.trim();
  const search: SQL | undefined = term
    ? ilike(reports.name, `%${escapeLike(term)}%`)
    : undefined;
  const typeFilter: SQL | undefined = params.type
    ? eq(reports.type, params.type)
    : undefined;

  const parts: SQL[] = [];
  if (scope) parts.push(scope);
  if (search) parts.push(search);
  if (typeFilter) parts.push(typeFilter);

  const whereClause =
    parts.length === 0
      ? undefined
      : parts.length === 1
        ? parts[0]!
        : and(...parts);

  const countBase = db.select({ total: count() }).from(reports);
  const [countRow] = await (whereClause
    ? countBase.where(whereClause)
    : countBase);

  const rowsBase = db.select().from(reports);
  const rows = await (whereClause ? rowsBase.where(whereClause) : rowsBase)
    .orderBy(desc(reports.reportDate))
    .limit(params.limit)
    .offset(params.offset);

  return { rows, total: Number(countRow?.total ?? 0) };
}

export async function getReportByIdAdmin(db: Database, id: string) {
  const [row] = await db
    .select()
    .from(reports)
    .where(eq(reports.id, id))
    .limit(1);
  return row ?? null;
}

async function slugTaken(db: Database, slug: string, excludeId?: string) {
  const cond = excludeId
    ? and(eq(reports.slug, slug), ne(reports.id, excludeId))
    : eq(reports.slug, slug);
  const [row] = await db
    .select({ id: reports.id })
    .from(reports)
    .where(cond)
    .limit(1);
  return Boolean(row);
}

export type CreateReportInput = {
  slug: string;
  name: string;
  summary?: string | null;
  type: string;
  periodLabel?: string | null;
  fileId: string;
  reportDate: string;
  isPublished?: boolean;
};

export async function createReport(
  db: Database,
  adminId: string,
  input: CreateReportInput,
): Promise<
  | { ok: true; row: typeof reports.$inferSelect }
  | { ok: false; code: "INVALID_SLUG" | "SLUG_TAKEN" | "MEDIA_NOT_FOUND" }
> {
  if (!isValidSlug(input.slug)) return { ok: false, code: "INVALID_SLUG" };
  if (await slugTaken(db, input.slug)) return { ok: false, code: "SLUG_TAKEN" };
  if (!(await pdfMediaExists(db, input.fileId))) {
    return { ok: false, code: "MEDIA_NOT_FOUND" };
  }

  const [row] = await db
    .insert(reports)
    .values({
      slug: input.slug,
      name: input.name,
      summary: input.summary ?? null,
      type: input.type,
      periodLabel: input.periodLabel ?? null,
      fileId: input.fileId,
      reportDate: input.reportDate,
      isPublished: input.isPublished ?? false,
      createdBy: adminId,
    })
    .returning();

  if (!row) throw new Error("insert report failed");
  return { ok: true, row };
}

export type PatchReportInput = Partial<{
  slug: string;
  name: string;
  summary: string | null;
  type: string;
  periodLabel: string | null;
  fileId: string;
  reportDate: string;
  isPublished: boolean;
}>;

export async function patchReport(
  db: Database,
  id: string,
  patch: PatchReportInput,
): Promise<
  | { ok: true; row: typeof reports.$inferSelect }
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
  const existing = await getReportByIdAdmin(db, id);
  if (!existing) return { ok: false, code: "NOT_FOUND" };
  if (existing.deletedAt) return { ok: false, code: "ARCHIVED" };

  if (patch.slug !== undefined) {
    if (!isValidSlug(patch.slug)) return { ok: false, code: "INVALID_SLUG" };
    if (patch.slug !== existing.slug && (await slugTaken(db, patch.slug, id))) {
      return { ok: false, code: "SLUG_TAKEN" };
    }
  }
  if (patch.fileId) {
    if (!(await pdfMediaExists(db, patch.fileId))) {
      return { ok: false, code: "MEDIA_NOT_FOUND" };
    }
  }

  const updates = stripUndefined(patch) as PatchReportInput;
  const [row] = await db
    .update(reports)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(reports.id, id))
    .returning();

  if (!row) return { ok: false, code: "NOT_FOUND" };
  return { ok: true, row };
}

export async function publishReport(
  db: Database,
  id: string,
): Promise<
  | { ok: true; row: typeof reports.$inferSelect }
  | { ok: false; code: "NOT_FOUND" | "ARCHIVED" }
> {
  const existing = await getReportByIdAdmin(db, id);
  if (!existing) return { ok: false, code: "NOT_FOUND" };
  if (existing.deletedAt) return { ok: false, code: "ARCHIVED" };

  const now = new Date();
  const [row] = await db
    .update(reports)
    .set({
      isPublished: true,
      updatedAt: now,
    })
    .where(eq(reports.id, id))
    .returning();

  if (!row) return { ok: false, code: "NOT_FOUND" };
  return { ok: true, row };
}

export async function unpublishReport(
  db: Database,
  id: string,
): Promise<
  | { ok: true; row: typeof reports.$inferSelect }
  | { ok: false; code: "NOT_FOUND" | "ARCHIVED" }
> {
  const existing = await getReportByIdAdmin(db, id);
  if (!existing) return { ok: false, code: "NOT_FOUND" };
  if (existing.deletedAt) return { ok: false, code: "ARCHIVED" };

  const now = new Date();
  const [row] = await db
    .update(reports)
    .set({
      isPublished: false,
      updatedAt: now,
    })
    .where(eq(reports.id, id))
    .returning();

  if (!row) return { ok: false, code: "NOT_FOUND" };
  return { ok: true, row };
}

export async function softDeleteReport(
  db: Database,
  id: string,
): Promise<
  | { ok: true; row: typeof reports.$inferSelect }
  | { ok: false; code: "NOT_FOUND" | "ALREADY_DELETED" }
> {
  const existing = await getReportByIdAdmin(db, id);
  if (!existing) return { ok: false, code: "NOT_FOUND" };
  if (existing.deletedAt) return { ok: false, code: "ALREADY_DELETED" };

  const now = new Date();
  const [row] = await db
    .update(reports)
    .set({
      deletedAt: now,
      updatedAt: now,
    })
    .where(eq(reports.id, id))
    .returning();

  if (!row) return { ok: false, code: "NOT_FOUND" };
  return { ok: true, row };
}

export async function hardDeleteReport(db: Database, id: string) {
  const [row] = await db
    .delete(reports)
    .where(eq(reports.id, id))
    .returning({ id: reports.id });
  return row ?? null;
}
