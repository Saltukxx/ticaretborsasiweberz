import { z } from "zod";

export const mapDistrictSlugParamsSchema = z.object({
  slug: z.string().min(1).max(50),
});

export const patchMapDistrictBodySchema = z
  .object({
    label: z.string().min(1).max(200).optional(),
    productLine: z.string().min(1).max(300).optional(),
    dailyVolume: z.string().min(1).max(50).optional(),
    memberCount: z.coerce.number().int().min(0).optional(),
    registrationCount: z.coerce.number().int().min(0).optional(),
    sortOrder: z.coerce.number().int().min(0).max(32767).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, {
    message: "En az bir alan gerekli.",
  });
