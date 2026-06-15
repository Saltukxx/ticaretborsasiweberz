import { z } from "zod";

export const adminEventsListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  scope: z.enum(["active", "deleted", "all"]).default("active"),
  q: z.string().max(200).optional(),
});

export const eventIdParamsSchema = z.object({
  id: z.string().uuid(),
});

const optionalUuid = z.union([z.string().uuid(), z.null()]).optional();

export const createEventBodySchema = z.object({
  slug: z.string().min(1).max(255),
  title: z.string().min(1).max(500),
  description: z.string().max(50_000).nullable().optional(),
  location: z.string().max(500).nullable().optional(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().nullable().optional(),
  coverImage: optionalUuid,
  registrationOpen: z.boolean().optional(),
  isStakeholder: z.boolean().optional(),
  statusLabel: z.string().max(100).nullable().optional(),
  isPublished: z.boolean().optional(),
});

export const patchEventBodySchema = z
  .object({
    slug: z.string().min(1).max(255).optional(),
    title: z.string().min(1).max(500).optional(),
    description: z.string().max(50_000).nullable().optional(),
    location: z.string().max(500).nullable().optional(),
    startsAt: z.coerce.date().optional(),
    endsAt: z.coerce.date().nullable().optional(),
    coverImage: optionalUuid,
    registrationOpen: z.boolean().optional(),
    isStakeholder: z.boolean().optional(),
    statusLabel: z.string().max(100).nullable().optional(),
    isPublished: z.boolean().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, {
    message: "En az bir alan gerekli.",
  });

export const publicEventsListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  when: z.enum(["all", "upcoming", "past"]).default("all"),
});
