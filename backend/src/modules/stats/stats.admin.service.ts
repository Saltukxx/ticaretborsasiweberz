import { and, asc, count, eq, isNull, type SQL } from "drizzle-orm";
import type { Database } from "../../db/connection.js";
import { statsSnapshot } from "../../db/schema/index.js";

function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}

export function normalizeStatValue(value: number | string): string {
  if (typeof value === "number") return String(value);
  return value;
}

export async function listStatsAdmin(
  db: Database,
  params: { limit: number; offset: number },
) {
  const [countRow] = await db.select({ total: count() }).from(statsSnapshot);

  const rows = await db
    .select()
    .from(statsSnapshot)
    .orderBy(asc(statsSnapshot.sortOrder), asc(statsSnapshot.label))
    .limit(params.limit)
    .offset(params.offset);

  return { rows, total: Number(countRow?.total ?? 0) };
}

export async function getStatByIdAdmin(db: Database, id: string) {
  const [row] = await db
    .select()
    .from(statsSnapshot)
    .where(eq(statsSnapshot.id, id))
    .limit(1);
  return row ?? null;
}

export type CreateStatInput = {
  label: string;
  value: string;
  suffix?: string | null;
  note?: string | null;
  groupKey?: string | null;
  sortOrder?: number;
};

export async function createStat(db: Database, input: CreateStatInput) {
  const [row] = await db
    .insert(statsSnapshot)
    .values({
      label: input.label,
      value: input.value,
      suffix: input.suffix ?? null,
      note: input.note ?? null,
      groupKey: input.groupKey ?? null,
      sortOrder: input.sortOrder ?? 0,
    })
    .returning();
  if (!row) throw new Error("insert stats failed");
  return row;
}

export type PatchStatInput = Partial<{
  label: string;
  value: string;
  suffix: string | null;
  note: string | null;
  groupKey: string | null;
  sortOrder: number;
}>;

export async function patchStat(
  db: Database,
  id: string,
  patch: PatchStatInput,
): Promise<{ ok: true; row: typeof statsSnapshot.$inferSelect } | { ok: false }> {
  const existing = await getStatByIdAdmin(db, id);
  if (!existing) return { ok: false };

  const updates = stripUndefined(patch) as PatchStatInput;
  const [row] = await db
    .update(statsSnapshot)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(statsSnapshot.id, id))
    .returning();

  if (!row) return { ok: false };
  return { ok: true, row };
}

export async function deleteStat(db: Database, id: string) {
  const [row] = await db
    .delete(statsSnapshot)
    .where(eq(statsSnapshot.id, id))
    .returning({ id: statsSnapshot.id });
  return row ?? null;
}

export async function listStatsPublic(db: Database, groupKey?: string) {
  const parts: SQL[] = [];
  if (groupKey === undefined || groupKey === "") {
    parts.push(isNull(statsSnapshot.groupKey));
  } else {
    parts.push(eq(statsSnapshot.groupKey, groupKey));
  }
  const whereClause = and(...parts) as SQL;

  return db
    .select()
    .from(statsSnapshot)
    .where(whereClause)
    .orderBy(asc(statsSnapshot.sortOrder), asc(statsSnapshot.label));
}
