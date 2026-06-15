import { z } from "zod";

export const reportsListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  scope: z.enum(["active", "deleted", "all"]).default("active"),
  type: z.string().max(50).optional(),
  q: z.string().max(200).optional(),
});

export const reportIdParamsSchema = z.object({
  id: z.string().uuid(),
});

const dateStr = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "invalid_date");

export const createReportBodySchema = z.object({
  slug: z.string().min(1).max(255),
  name: z.string().min(1).max(500),
  summary: z.string().max(20000).optional().nullable(),
  type: z.string().min(1).max(50),
  periodLabel: z.string().max(100).optional().nullable(),
  fileId: z.string().uuid(),
  reportDate: dateStr,
  isPublished: z.boolean().optional(),
});

export const patchReportBodySchema = z
  .object({
    slug: z.string().min(1).max(255).optional(),
    name: z.string().min(1).max(500).optional(),
    summary: z.string().max(20000).optional().nullable(),
    type: z.string().min(1).max(50).optional(),
    periodLabel: z.string().max(100).optional().nullable(),
    fileId: z.string().uuid().optional(),
    reportDate: dateStr.optional(),
    isPublished: z.boolean().optional(),
  })
  .strict();

export const publicReportsListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  type: z.string().max(50).optional(),
});
