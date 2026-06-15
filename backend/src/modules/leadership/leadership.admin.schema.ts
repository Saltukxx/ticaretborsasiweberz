import { z } from "zod";
import { LEADERSHIP_GROUP_KEYS } from "../../db/schema/leadership.js";

export const leadershipGroupKeySchema = z.enum(LEADERSHIP_GROUP_KEYS);

export const leadershipListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  active: z.enum(["all", "true", "false"]).default("all"),
  groupKey: leadershipGroupKeySchema.optional(),
  q: z.string().max(200).optional(),
});

export const leadershipIdParamsSchema = z.object({
  id: z.string().uuid(),
});

const roleKeyFieldSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z][a-z0-9_]*$/, "invalid_role_key");

export const createLeadershipBodySchema = z.object({
  roleKey: roleKeyFieldSchema.optional(),
  groupKey: leadershipGroupKeySchema.optional(),
  name: z.string().min(1).max(255),
  title: z.string().min(1).max(255),
  messageTitle: z.string().max(255).optional().nullable(),
  eyebrow: z.string().max(255).optional().nullable(),
  quoteLines: z.array(z.string().max(2000)).max(50).optional().nullable(),
  portraitId: z.string().uuid().optional().nullable(),
  sortOrder: z.coerce.number().int().min(-32768).max(32767).optional(),
  isActive: z.boolean().optional(),
});

export const upsertPresidentBodySchema = z.object({
  name: z.string().min(1).max(255),
  title: z.string().min(1).max(255),
  messageTitle: z.string().max(255).optional().nullable(),
  eyebrow: z.string().max(255).optional().nullable(),
  quoteLines: z
    .array(z.string().min(1).max(2000))
    .max(50)
    .optional()
    .nullable(),
  portraitId: z.union([z.string().uuid(), z.null()]).optional(),
  isActive: z.boolean().optional(),
});

export const patchLeadershipBodySchema = z
  .object({
    roleKey: roleKeyFieldSchema.optional(),
    groupKey: leadershipGroupKeySchema.optional(),
    name: z.string().min(1).max(255).optional(),
    title: z.string().min(1).max(255).optional(),
    messageTitle: z.string().max(255).optional().nullable(),
    eyebrow: z.string().max(255).optional().nullable(),
    quoteLines: z.array(z.string().max(2000)).max(50).optional().nullable(),
    portraitId: z.string().uuid().optional().nullable(),
    sortOrder: z.coerce.number().int().min(-32768).max(32767).optional(),
    isActive: z.boolean().optional(),
  })
  .strict();
