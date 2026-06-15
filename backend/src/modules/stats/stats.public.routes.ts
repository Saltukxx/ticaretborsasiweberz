import type { FastifyInstance } from "fastify";
import { listStatsPublic } from "./stats.admin.service.js";
import { publicStatsQuerySchema } from "./stats.admin.schema.js";

export async function publicStatsPlugin(fastify: FastifyInstance) {
  fastify.get("/stats", async (req, reply) => {
    const parsed = publicStatsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          details: parsed.error.flatten().fieldErrors,
        },
      });
    }
    const rows = await listStatsPublic(fastify.db, parsed.data.group);
    return reply.send({ data: rows });
  });
}
