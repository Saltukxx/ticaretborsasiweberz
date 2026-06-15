import type { FastifyInstance } from "fastify";
import { asc, count, eq, type SQL } from "drizzle-orm";
import { leadership, media } from "../../db/schema/index.js";
import { getPresidentLeadershipPublic } from "./leadership.admin.service.js";

export async function publicLeadershipPlugin(fastify: FastifyInstance) {
  fastify.get("/leadership/president", async (_req, reply) => {
    const row = await getPresidentLeadershipPublic(fastify.db);
    if (!row) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Başkan mesajı bulunamadı." },
      });
    }
    return reply.send({
      data: {
        id: row.id,
        roleKey: row.roleKey,
        name: row.name,
        title: row.title,
        messageTitle: row.messageTitle,
        eyebrow: row.eyebrow,
        quoteLines: row.quoteLines,
        portraitId: row.portraitId,
        portraitUrl: row.portraitUrl,
        sortOrder: row.sortOrder,
      },
    });
  });

  fastify.get("/leadership", async (_req, reply) => {
    const whereClause = eq(leadership.isActive, true) as SQL;

    const [countRow] = await fastify.db
      .select({ total: count() })
      .from(leadership)
      .where(whereClause);

    const rows = await fastify.db
      .select({
        id: leadership.id,
        roleKey: leadership.roleKey,
        groupKey: leadership.groupKey,
        name: leadership.name,
        title: leadership.title,
        messageTitle: leadership.messageTitle,
        eyebrow: leadership.eyebrow,
        quoteLines: leadership.quoteLines,
        portraitId: leadership.portraitId,
        portraitUrl: media.publicUrl,
        sortOrder: leadership.sortOrder,
      })
      .from(leadership)
      .leftJoin(media, eq(leadership.portraitId, media.id))
      .where(whereClause)
      .orderBy(asc(leadership.sortOrder), asc(leadership.name));

    return reply.send({
      data: rows,
      meta: { total: Number(countRow?.total ?? 0) },
    });
  });
}
