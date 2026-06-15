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
import { sanitizeOptionalRichHtml } from "../../lib/sanitizeHtml.js";
import type {
  ProjectIcon,
  ProjectMetric,
  ProjectPhase,
  ProjectStatus,
} from "../../db/project-fields.js";
import { projects } from "../../db/schema/index.js";
import { mediaExists } from "../../lib/media.js";
import { isValidSlug } from "../../lib/slug.js";

function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}

export type ProjectScope = "active" | "deleted" | "all";

function scopeFilter(scope: ProjectScope): SQL | undefined {
  switch (scope) {
    case "active":
      return isNull(projects.deletedAt);
    case "deleted":
      return isNotNull(projects.deletedAt);
    default:
      return undefined;
  }
}

function escapeLike(s: string): string {
  return s.replace(/[%_\\]/g, "\\$&");
}

export async function listProjectsAdmin(
  db: Database,
  params: {
    limit: number;
    offset: number;
    scope: ProjectScope;
    status?: ProjectStatus;
    q?: string;
  },
) {
  const scope = scopeFilter(params.scope);
  const term = params.q?.trim();
  const search: SQL | undefined = term
    ? ilike(projects.title, `%${escapeLike(term)}%`)
    : undefined;
  const statusFilter: SQL | undefined = params.status
    ? eq(projects.status, params.status)
    : undefined;

  const parts: SQL[] = [];
  if (scope) parts.push(scope);
  if (search) parts.push(search);
  if (statusFilter) parts.push(statusFilter);

  const whereClause =
    parts.length === 0
      ? undefined
      : parts.length === 1
        ? parts[0]!
        : and(...parts);

  const countBase = db.select({ total: count() }).from(projects);
  const [countRow] = await (whereClause
    ? countBase.where(whereClause)
    : countBase);

  const rowsBase = db.select().from(projects);
  const rows = await (whereClause ? rowsBase.where(whereClause) : rowsBase)
    .orderBy(desc(projects.sortOrder), desc(projects.updatedAt))
    .limit(params.limit)
    .offset(params.offset);

  return { rows, total: Number(countRow?.total ?? 0) };
}

export async function getProjectByIdAdmin(db: Database, id: string) {
  const [row] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);
  return row ?? null;
}

async function slugTaken(db: Database, slug: string, excludeId?: string) {
  const cond = excludeId
    ? and(eq(projects.slug, slug), ne(projects.id, excludeId))
    : eq(projects.slug, slug);
  const [row] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(cond)
    .limit(1);
  return Boolean(row);
}

export type ProjectShowcaseInput = {
  field?: string | null;
  progress?: number | null;
  targetLabel?: string | null;
  phaseLabel?: string | null;
  phases?: ProjectPhase[] | null;
  outputs?: string[] | null;
  icon?: ProjectIcon | null;
  year?: string | null;
  impact?: string | null;
  result?: string | null;
  metric?: ProjectMetric | null;
  sortOrder?: number;
};

function normalizeShowcase(input: ProjectShowcaseInput) {
  return {
    field: input.field ?? null,
    progress: input.progress ?? null,
    targetLabel: input.targetLabel ?? null,
    phaseLabel: input.phaseLabel ?? null,
    phases: input.phases ?? [],
    outputs: input.outputs ?? [],
    icon: input.icon ?? null,
    year: input.year ?? null,
    impact: input.impact ?? null,
    result: sanitizeOptionalRichHtml(input.result) ?? null,
    metric: input.metric ?? null,
    sortOrder: input.sortOrder ?? 0,
  };
}

export type CreateProjectInput = {
  slug: string;
  title: string;
  description?: string | null;
  body?: string | null;
  status: ProjectStatus;
  coverImage?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  isPublished?: boolean;
} & ProjectShowcaseInput;

export async function createProject(
  db: Database,
  adminId: string,
  input: CreateProjectInput,
): Promise<
  | { ok: true; row: typeof projects.$inferSelect }
  | { ok: false; code: "INVALID_SLUG" | "SLUG_TAKEN" | "MEDIA_NOT_FOUND" }
> {
  if (!isValidSlug(input.slug)) return { ok: false, code: "INVALID_SLUG" };
  if (await slugTaken(db, input.slug)) return { ok: false, code: "SLUG_TAKEN" };
  if (input.coverImage && !(await mediaExists(db, input.coverImage))) {
    return { ok: false, code: "MEDIA_NOT_FOUND" };
  }

  const showcase = normalizeShowcase(input);

  const [row] = await db
    .insert(projects)
    .values({
      slug: input.slug,
      title: input.title,
      description: sanitizeOptionalRichHtml(input.description) ?? null,
      body: sanitizeOptionalRichHtml(input.body) ?? null,
      status: input.status,
      coverImage: input.coverImage ?? null,
      startedAt: input.startedAt ?? null,
      completedAt: input.completedAt ?? null,
      isPublished: input.isPublished ?? false,
      createdBy: adminId,
      ...showcase,
    })
    .returning();

  if (!row) throw new Error("insert project failed");
  return { ok: true, row };
}

export type PatchProjectInput = Partial<{
  slug: string;
  title: string;
  description: string | null;
  body: string | null;
  status: ProjectStatus;
  coverImage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  isPublished: boolean;
}> &
  Partial<ProjectShowcaseInput>;

export async function patchProject(
  db: Database,
  id: string,
  patch: PatchProjectInput,
): Promise<
  | { ok: true; row: typeof projects.$inferSelect }
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
  const existing = await getProjectByIdAdmin(db, id);
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

  const updates = stripUndefined(patch) as PatchProjectInput;
  if (updates.description !== undefined) {
    updates.description = sanitizeOptionalRichHtml(updates.description) ?? null;
  }
  if (updates.body !== undefined) {
    updates.body = sanitizeOptionalRichHtml(updates.body) ?? null;
  }
  if (updates.result !== undefined) {
    updates.result = sanitizeOptionalRichHtml(updates.result) ?? null;
  }
  const { phases: phasesPatch, outputs: outputsPatch, ...rest } = updates;

  const [row] = await db
    .update(projects)
    .set({
      ...rest,
      ...(phasesPatch !== undefined ? { phases: phasesPatch ?? [] } : {}),
      ...(outputsPatch !== undefined ? { outputs: outputsPatch ?? [] } : {}),
      updatedAt: new Date(),
    })
    .where(eq(projects.id, id))
    .returning();

  if (!row) return { ok: false, code: "NOT_FOUND" };
  return { ok: true, row };
}

export async function publishProject(
  db: Database,
  id: string,
): Promise<
  | { ok: true; row: typeof projects.$inferSelect }
  | { ok: false; code: "NOT_FOUND" | "ARCHIVED" }
> {
  const existing = await getProjectByIdAdmin(db, id);
  if (!existing) return { ok: false, code: "NOT_FOUND" };
  if (existing.deletedAt) return { ok: false, code: "ARCHIVED" };

  const now = new Date();
  const [row] = await db
    .update(projects)
    .set({
      isPublished: true,
      updatedAt: now,
    })
    .where(eq(projects.id, id))
    .returning();

  if (!row) return { ok: false, code: "NOT_FOUND" };
  return { ok: true, row };
}

export async function unpublishProject(
  db: Database,
  id: string,
): Promise<
  | { ok: true; row: typeof projects.$inferSelect }
  | { ok: false; code: "NOT_FOUND" | "ARCHIVED" }
> {
  const existing = await getProjectByIdAdmin(db, id);
  if (!existing) return { ok: false, code: "NOT_FOUND" };
  if (existing.deletedAt) return { ok: false, code: "ARCHIVED" };

  const now = new Date();
  const [row] = await db
    .update(projects)
    .set({
      isPublished: false,
      updatedAt: now,
    })
    .where(eq(projects.id, id))
    .returning();

  if (!row) return { ok: false, code: "NOT_FOUND" };
  return { ok: true, row };
}

export async function softDeleteProject(
  db: Database,
  id: string,
): Promise<
  | { ok: true; row: typeof projects.$inferSelect }
  | { ok: false; code: "NOT_FOUND" | "ALREADY_DELETED" }
> {
  const existing = await getProjectByIdAdmin(db, id);
  if (!existing) return { ok: false, code: "NOT_FOUND" };
  if (existing.deletedAt) return { ok: false, code: "ALREADY_DELETED" };

  const now = new Date();
  const [row] = await db
    .update(projects)
    .set({
      deletedAt: now,
      updatedAt: now,
    })
    .where(eq(projects.id, id))
    .returning();

  if (!row) return { ok: false, code: "NOT_FOUND" };
  return { ok: true, row };
}

export async function hardDeleteProject(db: Database, id: string) {
  const [row] = await db
    .delete(projects)
    .where(eq(projects.id, id))
    .returning({ id: projects.id });
  return row ?? null;
}
