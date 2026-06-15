import type { FastifyInstance } from "fastify";
import { asc, count, eq, type SQL } from "drizzle-orm";
import { services } from "../../db/schema/index.js";
import { publicServicesListQuerySchema } from "./services.admin.schema.js";
import {
  getPublishedServiceAgreement,
  listPublishedServiceAgreements,
} from "./services.agreements.service.js";

export async function publicServicesPlugin(fastify: FastifyInstance) {
  fastify.get("/services", async (req, reply) => {
    const parsed = publicServicesListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          details: parsed.error.flatten().fieldErrors,
        },
      });
    }
    const { limit, offset } = parsed.data;

    const whereClause = eq(services.isActive, true) as SQL;

    const [countRow] = await fastify.db
      .select({ total: count() })
      .from(services)
      .where(whereClause);

    const rows = await fastify.db
      .select({
        id: services.id,
        slug: services.slug,
        title: services.title,
        description: services.description,
        icon: services.icon,
        sortOrder: services.sortOrder,
      })
      .from(services)
      .where(whereClause)
      .orderBy(asc(services.sortOrder), asc(services.title))
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

  fastify.get("/services/agreements", async (_req, reply) => {
    const rows = await listPublishedServiceAgreements(fastify.db);
    return reply.send({ data: rows });
  });

  fastify.get<{ Params: { slug: string } }>(
    "/services/agreements/:slug",
    async (req, reply) => {
      const row = await getPublishedServiceAgreement(fastify.db, req.params.slug);
      if (!row) {
        return reply.status(404).send({
          error: { code: "NOT_FOUND", message: "Anlaşma bulunamadı." },
        });
      }
      return reply.send({ data: row });
    },
  );
}
