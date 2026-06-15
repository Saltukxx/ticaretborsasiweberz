import { z } from "zod";
import { isSafeHref } from "../../lib/safeHref.js";

const safeHrefSchema = z
  .string()
  .max(300)
  .refine((v) => isSafeHref(v), { message: "Geçersiz bağlantı adresi." });

const heroKpiSchema = z.object({
  label: z.string().min(1).max(80),
  value: z.string().min(1).max(80),
  valueSuffix: z.string().max(40).optional(),
  highlighted: z.boolean().optional(),
});

export const patchHeroContentBodySchema = z
  .object({
    eyebrow: z.string().max(200).optional(),
    titleLead: z.string().max(200).optional(),
    titleEmphasis: z.string().max(100).optional(),
    titleSuffix: z.string().max(100).optional(),
    titleTagline: z.string().max(200).optional(),
    description: z.string().max(10_000).optional(),
    ctaPrimaryLabel: z.string().max(120).optional(),
    ctaPrimaryHref: safeHrefSchema.optional(),
    ctaSecondaryLabel: z.string().max(120).optional(),
    ctaSecondaryHref: safeHrefSchema.optional(),
    ctaLinkLabel: z.string().max(120).optional(),
    ctaLinkHref: safeHrefSchema.optional(),
    kpis: z.array(heroKpiSchema).min(1).max(6).optional(),
  })
  .refine((o) => Object.keys(o).length > 0, {
    message: "En az bir alan gerekli.",
  });
