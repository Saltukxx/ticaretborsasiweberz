import { z } from "zod";

export const usersListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  q: z.string().max(200).optional(),
  active: z.enum(["all", "true", "false"]).default("all"),
});

export const userIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const createUserBodySchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(12).max(200),
  name: z.string().min(1).max(255),
  role: z.enum(["super_admin", "editor"]),
});

export const patchUserBodySchema = z
  .object({
    email: z.string().email().max(255).optional(),
    name: z.string().min(1).max(255).optional(),
    role: z.enum(["super_admin", "editor"]).optional(),
    isActive: z.boolean().optional(),
    password: z.string().min(12).max(200).optional(),
  })
  .strict();
