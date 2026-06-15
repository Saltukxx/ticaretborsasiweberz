import { z } from "zod";

export const adminAnnouncementListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  scope: z.enum(["active", "deleted", "all"]).default("active"),
  q: z.string().max(200).optional(),
});

export const announcementIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const createAnnouncementBodySchema = z.object({
  slug: z.string().min(1).max(255),
  title: z.string().min(1).max(500),
  body: z.string().min(1).max(200_000),
  isTicker: z.boolean().optional(),
  priority: z.coerce.number().int().min(-32_768).max(32_767).optional(),
  expiresAt: z.coerce.date().nullable().optional(),
});

export const patchAnnouncementBodySchema = z
  .object({
    slug: z.string().min(1).max(255).optional(),
    title: z.string().min(1).max(500).optional(),
    body: z.string().min(1).max(200_000).optional(),
    isTicker: z.boolean().optional(),
    priority: z.coerce.number().int().min(-32_768).max(32_767).optional(),
    expiresAt: z.coerce.date().nullable().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, {
    message: "En az bir alan gerekli.",
  });
