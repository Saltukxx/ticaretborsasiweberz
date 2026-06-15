import { z } from "zod";

export const mediaListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(30),
  offset: z.coerce.number().int().min(0).default(0),
  q: z.string().max(200).optional(),
  mimePrefix: z.string().max(40).optional(),
});

export const mediaIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const patchMediaBodySchema = z.object({
  altText: z.union([z.string().max(500), z.null()]),
});
