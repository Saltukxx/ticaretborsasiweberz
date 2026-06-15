import { and, count, desc, eq, type SQL } from "drizzle-orm";
import type { Database } from "../../db/connection.js";
import {
  contactSubmissions,
  corporateProfile,
  legalPages,
  newsletterSubscribers,
} from "../../db/schema/index.js";
import { sanitizeRichHtml, stripHtmlToPlainText } from "../../lib/sanitizeHtml.js";
import { ensureCorporateProfile } from "../corporate/corporate.admin.service.js";

function emptyToNull(v: string | undefined): string | null | undefined {
  if (v === undefined) return undefined;
  const t = v.trim();
  return t === "" ? null : t;
}

export async function getSiteContactPublic(db: Database) {
  const profile = await ensureCorporateProfile(db);
  return {
    address: profile.address,
    phone: profile.phone,
    fax: profile.fax,
    emailPrimary: profile.emailPrimary,
    emailSecondary: profile.emailSecondary,
    hours: profile.hours,
    socialLinkedin: profile.socialLinkedin,
    socialX: profile.socialX,
    socialYoutube: profile.socialYoutube,
    socialInstagram: profile.socialInstagram,
  };
}

export async function getLegalPagePublic(
  db: Database,
  slug: string,
): Promise<
  | { ok: true; row: typeof legalPages.$inferSelect }
  | { ok: false; code: "NOT_FOUND" | "NOT_PUBLISHED" }
> {
  const [row] = await db
    .select()
    .from(legalPages)
    .where(eq(legalPages.slug, slug))
    .limit(1);
  if (!row) return { ok: false, code: "NOT_FOUND" };
  if (!row.isPublished) return { ok: false, code: "NOT_PUBLISHED" };
  return { ok: true, row };
}

export type CreateContactSubmissionInput = {
  fullName: string;
  organization?: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  ipAddress?: string;
  userAgent?: string;
};

export async function createContactSubmission(
  db: Database,
  input: CreateContactSubmissionInput,
) {
  const [row] = await db
    .insert(contactSubmissions)
    .values({
      fullName: stripHtmlToPlainText(input.fullName),
      organization: input.organization
        ? stripHtmlToPlainText(input.organization)
        : null,
      email: input.email.trim().toLowerCase(),
      phone: input.phone?.trim() || null,
      subject: stripHtmlToPlainText(input.subject),
      message: stripHtmlToPlainText(input.message),
      status: "new",
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    })
    .returning();
  if (!row) throw new Error("insert contact submission failed");
  return row;
}

export async function subscribeNewsletter(
  db: Database,
  input: { email: string; frequency: "daily" | "weekly" | "monthly"; ipAddress?: string },
) {
  const email = input.email.trim().toLowerCase();
  const [existing] = await db
    .select()
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.email, email))
    .limit(1);

  if (existing) {
    const [row] = await db
      .update(newsletterSubscribers)
      .set({
        frequency: input.frequency,
        status: "active",
        unsubscribedAt: null,
        ipAddress: input.ipAddress ?? existing.ipAddress,
      })
      .where(eq(newsletterSubscribers.id, existing.id))
      .returning();
    return row!;
  }

  const [row] = await db
    .insert(newsletterSubscribers)
    .values({
      email,
      frequency: input.frequency,
      status: "active",
      ipAddress: input.ipAddress ?? null,
    })
    .returning();
  if (!row) throw new Error("insert newsletter subscriber failed");
  return row;
}

/** İdempotent: kayıt yoksa veya zaten çıkmışsa sessizce başarılı sayılır. */
export async function unsubscribeNewsletter(db: Database, email: string) {
  const normalized = email.trim().toLowerCase();
  await db
    .update(newsletterSubscribers)
    .set({ status: "unsubscribed", unsubscribedAt: new Date() })
    .where(
      and(
        eq(newsletterSubscribers.email, normalized),
        eq(newsletterSubscribers.status, "active"),
      ),
    );
}

export async function listContactSubmissionsAdmin(
  db: Database,
  params: { limit: number; offset: number; status: "new" | "read" | "archived" | "all" },
) {
  const statusFilter: SQL | undefined =
    params.status === "all"
      ? undefined
      : eq(contactSubmissions.status, params.status);

  const countBase = db.select({ total: count() }).from(contactSubmissions);
  const [countRow] = await (statusFilter
    ? countBase.where(statusFilter)
    : countBase);

  const rowsBase = db.select().from(contactSubmissions);
  const rows = await (statusFilter ? rowsBase.where(statusFilter) : rowsBase)
    .orderBy(desc(contactSubmissions.createdAt))
    .limit(params.limit)
    .offset(params.offset);

  return { rows, total: Number(countRow?.total ?? 0) };
}

export async function getContactSubmissionByIdAdmin(db: Database, id: string) {
  const [row] = await db
    .select()
    .from(contactSubmissions)
    .where(eq(contactSubmissions.id, id))
    .limit(1);
  return row ?? null;
}

export async function patchContactSubmissionStatus(
  db: Database,
  id: string,
  status: "new" | "read" | "archived",
) {
  const [row] = await db
    .update(contactSubmissions)
    .set({ status })
    .where(eq(contactSubmissions.id, id))
    .returning();
  return row ?? null;
}

export async function listNewsletterSubscribersAdmin(
  db: Database,
  params: { limit: number; offset: number; status: "active" | "unsubscribed" | "all" },
) {
  const statusFilter: SQL | undefined =
    params.status === "all"
      ? undefined
      : eq(newsletterSubscribers.status, params.status);

  const countBase = db.select({ total: count() }).from(newsletterSubscribers);
  const [countRow] = await (statusFilter
    ? countBase.where(statusFilter)
    : countBase);

  const rowsBase = db.select().from(newsletterSubscribers);
  const rows = await (statusFilter ? rowsBase.where(statusFilter) : rowsBase)
    .orderBy(desc(newsletterSubscribers.createdAt))
    .limit(params.limit)
    .offset(params.offset);

  return { rows, total: Number(countRow?.total ?? 0) };
}

export async function listAllNewsletterSubscribersForExport(
  db: Database,
  status: "active" | "unsubscribed" | "all" = "active",
) {
  const statusFilter: SQL | undefined =
    status === "all" ? undefined : eq(newsletterSubscribers.status, status);
  const base = db.select().from(newsletterSubscribers);
  return statusFilter ? base.where(statusFilter) : base;
}

export async function listLegalPagesAdmin(db: Database) {
  return db.select().from(legalPages).orderBy(legalPages.slug);
}

export async function getLegalPageBySlugAdmin(db: Database, slug: string) {
  const [row] = await db
    .select()
    .from(legalPages)
    .where(eq(legalPages.slug, slug))
    .limit(1);
  return row ?? null;
}

export async function patchLegalPage(
  db: Database,
  slug: string,
  patch: Partial<{ title: string; body: string; isPublished: boolean }>,
) {
  const updates = { ...patch, updatedAt: new Date() };
  if (updates.body !== undefined) {
    updates.body = sanitizeRichHtml(updates.body);
  }
  const [row] = await db
    .update(legalPages)
    .set(updates)
    .where(eq(legalPages.slug, slug))
    .returning();
  return row ?? null;
}

export type PatchSiteContactInput = Partial<{
  address: string;
  phone: string;
  fax: string;
  emailPrimary: string;
  emailSecondary: string;
  hours: string;
  socialLinkedin: string;
  socialX: string;
  socialYoutube: string;
  socialInstagram: string;
}>;

export async function patchSiteContact(db: Database, patch: PatchSiteContactInput) {
  await ensureCorporateProfile(db);
  const normalized = {
    ...(patch.address !== undefined ? { address: patch.address } : {}),
    ...(patch.phone !== undefined ? { phone: patch.phone } : {}),
    ...(patch.fax !== undefined ? { fax: patch.fax } : {}),
    ...(patch.emailPrimary !== undefined
      ? { emailPrimary: emptyToNull(patch.emailPrimary) }
      : {}),
    ...(patch.emailSecondary !== undefined
      ? { emailSecondary: emptyToNull(patch.emailSecondary) }
      : {}),
    ...(patch.hours !== undefined ? { hours: patch.hours } : {}),
    ...(patch.socialLinkedin !== undefined
      ? { socialLinkedin: emptyToNull(patch.socialLinkedin) }
      : {}),
    ...(patch.socialX !== undefined ? { socialX: emptyToNull(patch.socialX) } : {}),
    ...(patch.socialYoutube !== undefined
      ? { socialYoutube: emptyToNull(patch.socialYoutube) }
      : {}),
    ...(patch.socialInstagram !== undefined
      ? { socialInstagram: emptyToNull(patch.socialInstagram) }
      : {}),
  };

  const [row] = await db
    .update(corporateProfile)
    .set({ ...normalized, updatedAt: new Date() })
    .returning();
  if (!row) throw new Error("patch site contact failed");
  return row;
}

export async function getSiteContactAdmin(db: Database) {
  const profile = await ensureCorporateProfile(db);
  return {
    address: profile.address,
    phone: profile.phone,
    fax: profile.fax,
    emailPrimary: profile.emailPrimary,
    emailSecondary: profile.emailSecondary,
    hours: profile.hours,
    socialLinkedin: profile.socialLinkedin,
    socialX: profile.socialX,
    socialYoutube: profile.socialYoutube,
    socialInstagram: profile.socialInstagram,
  };
}

export async function listPublishedLegalSlugs(db: Database) {
  return db
    .select({ slug: legalPages.slug, updatedAt: legalPages.updatedAt })
    .from(legalPages)
    .where(eq(legalPages.isPublished, true));
}
