import type { FastifyInstance } from "fastify";
import { and, asc, count, desc, eq, isNull, sql, type SQL } from "drizzle-orm";
import { media, projects } from "../../db/schema/index.js";
import {
  projectSlugParamsSchema,
  publicProjectsListQuerySchema,
} from "./projects.admin.schema.js";

const publicProjectColumns = {
  id: projects.id,
  slug: projects.slug,
  title: projects.title,
  description: projects.description,
  status: projects.status,
  field: projects.field,
  progress: projects.progress,
  targetLabel: projects.targetLabel,
  phaseLabel: projects.phaseLabel,
  phases: projects.phases,
  outputs: projects.outputs,
  icon: projects.icon,
  year: projects.year,
  impact: projects.impact,
  result: projects.result,
  metric: projects.metric,
  sortOrder: projects.sortOrder,
  startedAt: projects.startedAt,
  completedAt: projects.completedAt,
  coverImage: projects.coverImage,
  coverUrl: media.publicUrl,
  hasBody: sql<boolean>`(${projects.body} IS NOT NULL AND length(${projects.body}) > 0)`.as(
    "has_body",
  ),
};

const publicProjectDetailColumns = {
  ...publicProjectColumns,
  body: projects.body,
  createdAt: projects.createdAt,
  updatedAt: projects.updatedAt,
};

export async function publicProjectsPlugin(fastify: FastifyInstance) {
  fastify.get("/projects", async (req, reply) => {
    const parsed = publicProjectsListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          details: parsed.error.flatten().fieldErrors,
        },
      });
    }
    const { limit, offset, status } = parsed.data;

    const parts: SQL[] = [
      isNull(projects.deletedAt),
      eq(projects.isPublished, true),
    ];
    if (status) parts.push(eq(projects.status, status));
    const whereClause = and(...parts) as SQL;

    const [countRow] = await fastify.db
      .select({ total: count() })
      .from(projects)
      .where(whereClause);

    const rows = await fastify.db
      .select(publicProjectColumns)
      .from(projects)
      .leftJoin(media, eq(projects.coverImage, media.id))
      .where(whereClause)
      .orderBy(
        asc(projects.sortOrder),
        desc(projects.startedAt),
        desc(projects.createdAt),
      )
      .limit(limit)
      .offset(offset);

    return reply.send({
      data: rows,
      meta: {
        total: Number(countRow?.total ?? 0),
        limit,
        offset,
      },
    });
  });

  fastify.get("/projects/:slug", async (req, reply) => {
    const params = projectSlugParamsSchema.safeParse(req.params);
    if (!params.success) {
      return reply.status(400).send({
        error: { code: "VALIDATION_ERROR", message: "Geçersiz proje adresi" },
      });
    }
    const slug = params.data.slug;

    const [row] = await fastify.db
      .select(publicProjectDetailColumns)
      .from(projects)
      .leftJoin(media, eq(projects.coverImage, media.id))
      .where(
        and(
          eq(projects.slug, slug),
          isNull(projects.deletedAt),
          eq(projects.isPublished, true),
        ),
      )
      .limit(1);

    if (!row) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Proje bulunamadı." },
      });
    }
    return reply.send({ data: row });
  });
}
