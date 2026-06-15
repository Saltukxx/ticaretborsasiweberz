import { z } from "zod";

export const patchCorporateProfileBodySchema = z
  .object({
    eyebrow: z.string().max(200).optional(),
    heading: z.string().max(500).optional(),
    lead: z.string().max(10_000).optional(),
    mission: z.string().max(10_000).optional(),
    vision: z.string().max(10_000).optional(),
  })
  .refine((o) => Object.keys(o).length > 0, {
    message: "En az bir alan gerekli.",
  });

export const milestoneIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const createMilestoneBodySchema = z.object({
  year: z.string().min(1).max(10),
  title: z.string().min(1).max(300),
  description: z.string().min(1).max(10_000),
  sortOrder: z.coerce.number().int().min(0).max(32767).optional(),
});

export const patchMilestoneBodySchema = z
  .object({
    year: z.string().min(1).max(10).optional(),
    title: z.string().min(1).max(300).optional(),
    description: z.string().min(1).max(10_000).optional(),
    sortOrder: z.coerce.number().int().min(0).max(32767).optional(),
  })
  .refine((o) => Object.keys(o).length > 0, {
    message: "En az bir alan gerekli.",
  });

export const corporateDocumentIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const patchCorporateDocumentBodySchema = z
  .object({
    title: z.string().min(1).max(300).optional(),
    summary: z.string().max(2000).nullable().optional(),
    body: z.string().max(500_000).nullable().optional(),
    category: z.enum(["politika", "tarihce", "plan", "organizasyon"]).optional(),
    sortOrder: z.coerce.number().int().min(0).max(32767).optional(),
    isPublished: z.boolean().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, {
    message: "En az bir alan gerekli.",
  });
