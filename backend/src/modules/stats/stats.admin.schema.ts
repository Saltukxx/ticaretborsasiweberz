import { z } from "zod";

const numericLike = z.union([
  z.number().finite(),
  z.string().regex(/^-?\d+(\.\d+)?$/),
]);

export const statsListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const publicStatsQuerySchema = z.object({
  group: z.string().max(50).optional(),
});

export const statsIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const createStatBodySchema = z.object({
  label: z.string().min(1).max(255),
  value: numericLike,
  suffix: z.string().max(50).optional().nullable(),
  note: z.string().max(255).optional().nullable(),
  groupKey: z.string().max(50).optional().nullable(),
  sortOrder: z.coerce.number().int().min(-32768).max(32767).optional(),
});

export const patchStatBodySchema = z
  .object({
    label: z.string().min(1).max(255).optional(),
    value: numericLike.optional(),
    suffix: z.string().max(50).optional().nullable(),
    note: z.string().max(255).optional().nullable(),
    groupKey: z.string().max(50).optional().nullable(),
    sortOrder: z.coerce.number().int().min(-32768).max(32767).optional(),
  })
  .strict();
