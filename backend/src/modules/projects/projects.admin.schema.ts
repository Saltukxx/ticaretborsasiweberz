import { z } from "zod";

export const projectsListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  scope: z.enum(["active", "deleted", "all"]).default("active"),
  status: z.enum(["ongoing", "completed"]).optional(),
  q: z.string().max(200).optional(),
});

export const projectIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const projectSlugParamsSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
});

const optionalDateField = z
  .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "invalid_date"), z.null()])
  .optional();

export const projectPhaseSchema = z.object({
  label: z.string().min(1).max(100),
  done: z.boolean(),
});

export const projectMetricSchema = z.object({
  value: z.string().min(1).max(50),
  label: z.string().min(1).max(200),
});

export const projectIconSchema = z.enum(["digital", "data", "lab"]);

export const projectStatusSchema = z.enum(["ongoing", "completed"]);

const showcaseFields = {
  field: z.string().max(200).optional().nullable(),
  progress: z.coerce.number().int().min(0).max(100).optional().nullable(),
  targetLabel: z.string().max(100).optional().nullable(),
  phaseLabel: z.string().max(100).optional().nullable(),
  phases: z.array(projectPhaseSchema).max(20).optional().nullable(),
  outputs: z.array(z.string().min(1).max(200)).max(30).optional().nullable(),
  icon: projectIconSchema.optional().nullable(),
  year: z.string().max(10).optional().nullable(),
  impact: z.string().max(500).optional().nullable(),
  result: z.string().max(5000).optional().nullable(),
  metric: projectMetricSchema.optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).max(32767).optional(),
};

export const createProjectBodySchema = z.object({
  slug: z.string().min(1).max(255),
  title: z.string().min(1).max(500),
  description: z.string().max(50000).optional().nullable(),
  body: z.string().max(200000).optional().nullable(),
  status: projectStatusSchema.default("ongoing"),
  coverImage: z.string().uuid().optional().nullable(),
  startedAt: optionalDateField,
  completedAt: optionalDateField,
  isPublished: z.boolean().optional(),
  ...showcaseFields,
});

export const patchProjectBodySchema = z
  .object({
    slug: z.string().min(1).max(255).optional(),
    title: z.string().min(1).max(500).optional(),
    description: z.string().max(50000).optional().nullable(),
    body: z.string().max(200000).optional().nullable(),
    status: projectStatusSchema.optional(),
    coverImage: z.string().uuid().optional().nullable(),
    startedAt: optionalDateField,
    completedAt: optionalDateField,
    isPublished: z.boolean().optional(),
    ...showcaseFields,
  })
  .strict();

export const publicProjectsListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  status: projectStatusSchema.optional(),
});
