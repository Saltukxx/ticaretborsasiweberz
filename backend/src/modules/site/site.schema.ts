import { z } from "zod";
import { LEGAL_PAGE_SLUGS } from "../../db/schema/site.js";
import { isSafeHref } from "../../lib/safeHref.js";

const optionalSafeHrefSchema = z
  .string()
  .max(500)
  .refine((v) => v === "" || isSafeHref(v), { message: "Geçersiz bağlantı adresi." });

export const contactFormBodySchema = z.object({
  fullName: z.string().min(1).max(200),
  organization: z.string().max(300).optional(),
  email: z.string().email().max(320),
  phone: z.string().max(50).optional(),
  subject: z.string().min(1).max(500),
  message: z.string().min(1).max(10_000),
});

export const newsletterSubscribeBodySchema = z.object({
  email: z.string().email().max(320),
  frequency: z.enum(["daily", "weekly", "monthly"]).default("weekly"),
});

export const legalSlugParamsSchema = z.object({
  slug: z.enum(LEGAL_PAGE_SLUGS),
});

export const contactSubmissionIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const patchContactSubmissionBodySchema = z.object({
  status: z.enum(["new", "read", "archived"]),
});

export const patchLegalPageBodySchema = z
  .object({
    title: z.string().min(1).max(300).optional(),
    body: z.string().max(100_000).optional(),
    isPublished: z.boolean().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, {
    message: "En az bir alan gerekli.",
  });

export const patchSiteContactBodySchema = z
  .object({
    address: z.string().max(2000).optional(),
    phone: z.string().max(100).optional(),
    fax: z.string().max(100).optional(),
    emailPrimary: z.string().max(320).optional(),
    emailSecondary: z.string().max(320).optional(),
    hours: z.string().max(500).optional(),
    socialLinkedin: optionalSafeHrefSchema.optional(),
    socialX: optionalSafeHrefSchema.optional(),
    socialYoutube: optionalSafeHrefSchema.optional(),
    socialInstagram: optionalSafeHrefSchema.optional(),
  })
  .refine((o) => Object.keys(o).length > 0, {
    message: "En az bir alan gerekli.",
  });

export const newsletterUnsubscribeBodySchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  token: z.string().regex(/^[0-9a-f]{64}$/i, "invalid_token"),
});

export const adminContactSubmissionsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  status: z.enum(["new", "read", "archived", "all"]).default("all"),
});

export const adminNewsletterQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
  status: z.enum(["active", "unsubscribed", "all"]).default("active"),
});
