import { asc, eq } from "drizzle-orm";
import type { Database } from "../../db/connection.js";
import { sanitizeRichHtml } from "../../lib/sanitizeHtml.js";
import { corporateMilestones, corporateProfile } from "../../db/schema/index.js";

function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}

const DEFAULT_PROFILE = {
  eyebrow: "Kurumsal · 1946'dan Beri",
  heading: "Erzurum Ticaret Borsası",
  lead:
    "Bölgemizin üretim, ticaret ve piyasa yapısına güvenilir kurumsal altyapı sunuyoruz. Tarımdan veriye, gelenekten dijitale uzanan 80 yılı aşkın kurumsal birikimle hizmet veriyoruz.",
  mission:
    "Üretici, tüccar ve sanayiciye şeffaf piyasa verisi ve kurumsal hizmet üreterek bölgesel ticarete istikrar kazandırmak.",
  vision:
    "Doğu Anadolu'nun dijitalleşen, veri odaklı ve uluslararası standartlara uyumlu ticaret merkezi olmak.",
};

export async function ensureCorporateProfile(db: Database) {
  const [existing] = await db.select().from(corporateProfile).limit(1);
  if (existing) return existing;

  const [row] = await db.insert(corporateProfile).values(DEFAULT_PROFILE).returning();
  if (!row) throw new Error("insert corporate profile failed");
  return row;
}

export async function getCorporateProfileAdmin(db: Database) {
  return ensureCorporateProfile(db);
}

export type PatchCorporateProfileInput = Partial<{
  eyebrow: string;
  heading: string;
  lead: string;
  mission: string;
  vision: string;
}>;

export async function patchCorporateProfile(
  db: Database,
  patch: PatchCorporateProfileInput,
) {
  await ensureCorporateProfile(db);
  const updates = stripUndefined(patch) as PatchCorporateProfileInput;
  for (const key of ["lead", "mission", "vision"] as const) {
    if (updates[key] !== undefined) {
      updates[key] = sanitizeRichHtml(updates[key]!);
    }
  }
  const [row] = await db
    .update(corporateProfile)
    .set({ ...updates, updatedAt: new Date() })
    .returning();
  if (!row) throw new Error("patch corporate profile failed");
  return row;
}

export async function listCorporateMilestonesAdmin(db: Database) {
  return db
    .select()
    .from(corporateMilestones)
    .orderBy(asc(corporateMilestones.sortOrder), asc(corporateMilestones.year));
}

export async function getMilestoneByIdAdmin(db: Database, id: string) {
  const [row] = await db
    .select()
    .from(corporateMilestones)
    .where(eq(corporateMilestones.id, id))
    .limit(1);
  return row ?? null;
}

export type CreateMilestoneInput = {
  year: string;
  title: string;
  description: string;
  sortOrder?: number;
};

export async function createMilestone(db: Database, input: CreateMilestoneInput) {
  const [row] = await db
    .insert(corporateMilestones)
    .values({
      year: input.year,
      title: input.title,
      description: sanitizeRichHtml(input.description),
      sortOrder: input.sortOrder ?? 0,
    })
    .returning();
  if (!row) throw new Error("insert milestone failed");
  return row;
}

export type PatchMilestoneInput = Partial<CreateMilestoneInput>;

export async function patchMilestone(
  db: Database,
  id: string,
  patch: PatchMilestoneInput,
): Promise<
  | { ok: true; row: typeof corporateMilestones.$inferSelect }
  | { ok: false; code: "NOT_FOUND" }
> {
  const existing = await getMilestoneByIdAdmin(db, id);
  if (!existing) return { ok: false, code: "NOT_FOUND" };

  const updates = stripUndefined(patch) as PatchMilestoneInput;
  if (updates.description !== undefined) {
    updates.description = sanitizeRichHtml(updates.description);
  }
  const [row] = await db
    .update(corporateMilestones)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(corporateMilestones.id, id))
    .returning();

  if (!row) return { ok: false, code: "NOT_FOUND" };
  return { ok: true, row };
}

export async function deleteMilestone(db: Database, id: string) {
  const [row] = await db
    .delete(corporateMilestones)
    .where(eq(corporateMilestones.id, id))
    .returning({ id: corporateMilestones.id });
  return row ?? null;
}

export async function getCorporatePublic(db: Database) {
  const profile = await ensureCorporateProfile(db);
  const milestones = await listCorporateMilestonesAdmin(db);
  return { profile, milestones };
}
