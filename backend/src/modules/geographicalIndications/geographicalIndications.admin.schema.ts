import { z } from "zod";

export const geoListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  active: z.enum(["all", "true", "false"]).default("all"),
  category: z.string().max(100).optional(),
  q: z.string().max(200).optional(),
});

export const geoIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const createGeoBodySchema = z.object({
  slug: z.string().min(1).max(255),
  name: z.string().min(1).max(500),
  category: z.string().min(1).max(100),
  type: z.string().min(1).max(100),
  registrationNo: z.string().max(100).optional().nullable(),
  registeredAt: z
    .union([
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "invalid_date"),
      z.null(),
    ])
    .optional(),
  district: z.string().max(100).optional().nullable(),
  isHighlight: z.boolean().optional(),
  story: z.string().max(50000).optional().nullable(),
  coverImage: z.string().uuid().optional().nullable(),
  sortOrder: z.coerce.number().int().min(-32768).max(32767).optional(),
  isActive: z.boolean().optional(),
});

export const patchGeoBodySchema = z
  .object({
    slug: z.string().min(1).max(255).optional(),
    name: z.string().min(1).max(500).optional(),
    category: z.string().min(1).max(100).optional(),
    type: z.string().min(1).max(100).optional(),
    registrationNo: z.string().max(100).optional().nullable(),
    registeredAt: z
      .union([
        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "invalid_date"),
        z.null(),
      ])
      .optional(),
    district: z.string().max(100).optional().nullable(),
    isHighlight: z.boolean().optional(),
    story: z.string().max(50000).optional().nullable(),
    coverImage: z.string().uuid().optional().nullable(),
    sortOrder: z.coerce.number().int().min(-32768).max(32767).optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export const publicGeoListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  category: z.string().max(100).optional(),
});
