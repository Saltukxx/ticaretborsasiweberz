import { z } from "zod";

export const servicesListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  active: z.enum(["all", "true", "false"]).default("all"),
  q: z.string().max(200).optional(),
});

export const serviceIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const createServiceBodySchema = z.object({
  slug: z.string().min(1).max(100),
  title: z.string().min(1).max(255),
  description: z.string().min(1).max(20000),
  icon: z.string().max(100).optional().nullable(),
  sortOrder: z.coerce.number().int().min(-32768).max(32767).optional(),
  isActive: z.boolean().optional(),
});

export const patchServiceBodySchema = z
  .object({
    slug: z.string().min(1).max(100).optional(),
    title: z.string().min(1).max(255).optional(),
    description: z.string().min(1).max(20000).optional(),
    icon: z.string().max(100).optional().nullable(),
    sortOrder: z.coerce.number().int().min(-32768).max(32767).optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export const publicServicesListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
