import { asc, eq } from "drizzle-orm";
import type { Database } from "../../db/connection.js";
import { mapDistricts } from "../../db/schema/index.js";

function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}

export async function listMapDistrictsAdmin(db: Database) {
  return db
    .select()
    .from(mapDistricts)
    .orderBy(asc(mapDistricts.sortOrder), asc(mapDistricts.label));
}

export async function getMapDistrictBySlugAdmin(db: Database, slug: string) {
  const [row] = await db
    .select()
    .from(mapDistricts)
    .where(eq(mapDistricts.slug, slug))
    .limit(1);
  return row ?? null;
}

export type PatchMapDistrictInput = Partial<{
  label: string;
  productLine: string;
  dailyVolume: string;
  memberCount: number;
  registrationCount: number;
  sortOrder: number;
  isActive: boolean;
}>;

export async function patchMapDistrict(
  db: Database,
  slug: string,
  patch: PatchMapDistrictInput,
): Promise<
  | { ok: true; row: typeof mapDistricts.$inferSelect }
  | { ok: false; code: "NOT_FOUND" }
> {
  const existing = await getMapDistrictBySlugAdmin(db, slug);
  if (!existing) return { ok: false, code: "NOT_FOUND" };

  const updates = stripUndefined(patch);
  const [row] = await db
    .update(mapDistricts)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(mapDistricts.slug, slug))
    .returning();

  if (!row) return { ok: false, code: "NOT_FOUND" };
  return { ok: true, row };
}

export async function listMapDistrictsPublic(db: Database) {
  return db
    .select({
      slug: mapDistricts.slug,
      label: mapDistricts.label,
      productLine: mapDistricts.productLine,
      dailyVolume: mapDistricts.dailyVolume,
      memberCount: mapDistricts.memberCount,
      registrationCount: mapDistricts.registrationCount,
      sortOrder: mapDistricts.sortOrder,
    })
    .from(mapDistricts)
    .where(eq(mapDistricts.isActive, true))
    .orderBy(asc(mapDistricts.sortOrder), asc(mapDistricts.label));
}
