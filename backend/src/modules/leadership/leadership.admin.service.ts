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
import { leadership, media } from "../../db/schema/index.js";
import type { LeadershipGroupKey } from "../../db/schema/leadership.js";
import { mediaExists } from "../../lib/media.js";
import {
  buildRoleKeyBase,
  withRoleKeySuffix,
} from "./leadershipRoleKey.js";

export const PRESIDENT_ROLE_KEY = "baskan";

function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}

function escapeLike(s: string): string {
  return s.replace(/[%_\\]/g, "\\$&");
}

async function roleKeyTaken(db: Database, roleKey: string, excludeId?: string) {
  const cond = excludeId
    ? and(eq(leadership.roleKey, roleKey), ne(leadership.id, excludeId))
    : eq(leadership.roleKey, roleKey);
  const [row] = await db
    .select({ id: leadership.id })
    .from(leadership)
    .where(cond)
    .limit(1);
  return Boolean(row);
}

export async function generateUniqueRoleKey(
  db: Database,
  groupKey: LeadershipGroupKey,
  name: string,
  excludeId?: string,
): Promise<string> {
  const base = buildRoleKeyBase(groupKey, name);
  for (let n = 1; n <= 99; n++) {
    const candidate = withRoleKeySuffix(base, n);
    if (!(await roleKeyTaken(db, candidate, excludeId))) {
      return candidate;
    }
  }
  throw new Error("role_key_exhausted");
}

export async function listLeadershipAdmin(
  db: Database,
  params: {
    limit: number;
    offset: number;
    active: "all" | "true" | "false";
    groupKey?: LeadershipGroupKey;
    q?: string;
  },
) {
  const term = params.q?.trim();
  const search: SQL | undefined = term
    ? ilike(leadership.name, `%${escapeLike(term)}%`)
    : undefined;

  const activeFilter: SQL | undefined =
    params.active === "all"
      ? undefined
      : eq(leadership.isActive, params.active === "true");

  const groupFilter: SQL | undefined = params.groupKey
    ? eq(leadership.groupKey, params.groupKey)
    : undefined;

  const parts: SQL[] = [];
  if (search) parts.push(search);
  if (activeFilter) parts.push(activeFilter);
  if (groupFilter) parts.push(groupFilter);

  const whereClause =
    parts.length === 0
      ? undefined
      : parts.length === 1
        ? parts[0]!
        : and(...parts);

  const countBase = db.select({ total: count() }).from(leadership);
  const [countRow] = await (whereClause
    ? countBase.where(whereClause)
    : countBase);

  const rowsBase = db.select().from(leadership);
  const rows = await (whereClause ? rowsBase.where(whereClause) : rowsBase)
    .orderBy(asc(leadership.sortOrder), asc(leadership.name))
    .limit(params.limit)
    .offset(params.offset);

  return { rows, total: Number(countRow?.total ?? 0) };
}

export async function getLeadershipByIdAdmin(db: Database, id: string) {
  const [row] = await db
    .select()
    .from(leadership)
    .where(eq(leadership.id, id))
    .limit(1);
  return row ?? null;
}

export async function getLeadershipByRoleKeyAdmin(db: Database, roleKey: string) {
  const [row] = await db
    .select()
    .from(leadership)
    .where(eq(leadership.roleKey, roleKey))
    .limit(1);
  return row ?? null;
}

export type PresidentLeadershipRow = {
  id: string;
  roleKey: string;
  name: string;
  title: string;
  messageTitle: string | null;
  eyebrow: string | null;
  quoteLines: string[] | null;
  portraitId: string | null;
  portraitUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  updatedAt: Date;
};

export async function getPresidentLeadershipAdmin(
  db: Database,
): Promise<PresidentLeadershipRow | null> {
  const [row] = await db
    .select({
      id: leadership.id,
      roleKey: leadership.roleKey,
      name: leadership.name,
      title: leadership.title,
      messageTitle: leadership.messageTitle,
      eyebrow: leadership.eyebrow,
      quoteLines: leadership.quoteLines,
      portraitId: leadership.portraitId,
      portraitUrl: media.publicUrl,
      sortOrder: leadership.sortOrder,
      isActive: leadership.isActive,
      updatedAt: leadership.updatedAt,
    })
    .from(leadership)
    .leftJoin(media, eq(leadership.portraitId, media.id))
    .where(eq(leadership.roleKey, PRESIDENT_ROLE_KEY))
    .limit(1);

  return row ?? null;
}

export async function getPresidentLeadershipPublic(
  db: Database,
): Promise<PresidentLeadershipRow | null> {
  const [row] = await db
    .select({
      id: leadership.id,
      roleKey: leadership.roleKey,
      name: leadership.name,
      title: leadership.title,
      messageTitle: leadership.messageTitle,
      eyebrow: leadership.eyebrow,
      quoteLines: leadership.quoteLines,
      portraitId: leadership.portraitId,
      portraitUrl: media.publicUrl,
      sortOrder: leadership.sortOrder,
      isActive: leadership.isActive,
      updatedAt: leadership.updatedAt,
    })
    .from(leadership)
    .leftJoin(media, eq(leadership.portraitId, media.id))
    .where(
      and(eq(leadership.roleKey, PRESIDENT_ROLE_KEY), eq(leadership.isActive, true)),
    )
    .limit(1);

  return row ?? null;
}

export type CreateLeadershipInput = {
  roleKey?: string;
  groupKey?: LeadershipGroupKey;
  name: string;
  title: string;
  messageTitle?: string | null;
  eyebrow?: string | null;
  quoteLines?: string[] | null;
  portraitId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};

export async function createLeadership(
  db: Database,
  input: CreateLeadershipInput,
): Promise<
  | { ok: true; row: typeof leadership.$inferSelect }
  | { ok: false; code: "ROLE_KEY_TAKEN" | "MEDIA_NOT_FOUND" }
> {
  const groupKey = (input.groupKey ?? "yonetim_kurulu") as LeadershipGroupKey;
  const roleKey =
    input.roleKey?.trim() ||
    (await generateUniqueRoleKey(db, groupKey, input.name));

  if (await roleKeyTaken(db, roleKey)) {
    return { ok: false, code: "ROLE_KEY_TAKEN" };
  }
  if (input.portraitId && !(await mediaExists(db, input.portraitId))) {
    return { ok: false, code: "MEDIA_NOT_FOUND" };
  }

  const [row] = await db
    .insert(leadership)
    .values({
      roleKey,
      groupKey,
      name: input.name,
      title: input.title,
      messageTitle: input.messageTitle ?? null,
      eyebrow: input.eyebrow ?? null,
      quoteLines: input.quoteLines ?? null,
      portraitId: input.portraitId ?? null,
      sortOrder: input.sortOrder ?? 0,
      isActive: input.isActive ?? true,
    })
    .returning();

  if (!row) throw new Error("insert leadership failed");
  return { ok: true, row };
}

export type PatchLeadershipInput = Partial<{
  roleKey: string;
  groupKey: string;
  name: string;
  title: string;
  messageTitle: string | null;
  eyebrow: string | null;
  quoteLines: string[] | null;
  portraitId: string | null;
  sortOrder: number;
  isActive: boolean;
}>;

export async function patchLeadership(
  db: Database,
  id: string,
  patch: PatchLeadershipInput,
): Promise<
  | { ok: true; row: typeof leadership.$inferSelect }
  | { ok: false; code: "NOT_FOUND" | "ROLE_KEY_TAKEN" | "MEDIA_NOT_FOUND" }
> {
  const existing = await getLeadershipByIdAdmin(db, id);
  if (!existing) return { ok: false, code: "NOT_FOUND" };

  if (patch.roleKey !== undefined) {
    if (
      patch.roleKey !== existing.roleKey &&
      (await roleKeyTaken(db, patch.roleKey, id))
    ) {
      return { ok: false, code: "ROLE_KEY_TAKEN" };
    }
  }
  if (patch.portraitId) {
    if (!(await mediaExists(db, patch.portraitId))) {
      return { ok: false, code: "MEDIA_NOT_FOUND" };
    }
  }

  const updates = stripUndefined(patch) as PatchLeadershipInput;
  const [row] = await db
    .update(leadership)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(leadership.id, id))
    .returning();

  if (!row) return { ok: false, code: "NOT_FOUND" };
  return { ok: true, row };
}

export type UpsertPresidentInput = {
  name: string;
  title: string;
  messageTitle?: string | null;
  eyebrow?: string | null;
  quoteLines?: string[] | null;
  portraitId?: string | null;
  isActive?: boolean;
};

export async function upsertPresidentLeadership(
  db: Database,
  input: UpsertPresidentInput,
): Promise<
  | { ok: true; row: typeof leadership.$inferSelect }
  | { ok: false; code: "MEDIA_NOT_FOUND" | "ROLE_KEY_TAKEN" | "NOT_FOUND" }
> {
  const existing = await getLeadershipByRoleKeyAdmin(db, PRESIDENT_ROLE_KEY);
  if (!existing) {
    return createLeadership(db, {
      roleKey: PRESIDENT_ROLE_KEY,
      name: input.name,
      title: input.title,
      messageTitle: input.messageTitle ?? null,
      eyebrow: input.eyebrow ?? null,
      quoteLines: input.quoteLines ?? null,
      portraitId: input.portraitId ?? null,
      sortOrder: 0,
      isActive: input.isActive ?? true,
    });
  }

  return patchLeadership(db, existing.id, {
    name: input.name,
    title: input.title,
    messageTitle: input.messageTitle,
    eyebrow: input.eyebrow,
    quoteLines: input.quoteLines,
    portraitId: input.portraitId,
    isActive: input.isActive,
  });
}

export async function deleteLeadership(
  db: Database,
  id: string,
): Promise<
  | { ok: true; id: string }
  | { ok: false; code: "NOT_FOUND" | "PRESIDENT_PROTECTED" }
> {
  const existing = await getLeadershipByIdAdmin(db, id);
  if (!existing) return { ok: false, code: "NOT_FOUND" };
  if (existing.roleKey === PRESIDENT_ROLE_KEY) {
    return { ok: false, code: "PRESIDENT_PROTECTED" };
  }

  const [row] = await db
    .delete(leadership)
    .where(eq(leadership.id, id))
    .returning({ id: leadership.id });
  if (!row) return { ok: false, code: "NOT_FOUND" };
  return { ok: true, id: row.id };
}
