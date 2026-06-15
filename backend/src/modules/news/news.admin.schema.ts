import { z } from "zod";

export const adminNewsListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  scope: z.enum(["active", "deleted", "all"]).default("active"),
  q: z.string().max(200).optional(),
});

export const newsIdParamsSchema = z.object({
  id: z.string().uuid(),
});

const optionalUuid = z.union([z.string().uuid(), z.null()]).optional();

export const createNewsBodySchema = z.object({
  slug: z.string().min(1).max(255),
  title: z.string().min(1).max(500),
  excerpt: z.string().min(1).max(10_000),
  body: z.string().min(1).max(500_000),
  category: z.string().min(1).max(100),
  tone: z.string().min(1).max(50),
  isFeatured: z.boolean().optional(),
  coverImage: optionalUuid,
});

export const patchNewsBodySchema = z
  .object({
    slug: z.string().min(1).max(255).optional(),
    title: z.string().min(1).max(500).optional(),
    excerpt: z.string().min(1).max(10_000).optional(),
    body: z.string().min(1).max(500_000).optional(),
    category: z.string().min(1).max(100).optional(),
    tone: z.string().min(1).max(50).optional(),
    isFeatured: z.boolean().optional(),
    coverImage: optionalUuid,
  })
  .refine((o) => Object.keys(o).length > 0, {
    message: "En az bir alan gerekli.",
  });
