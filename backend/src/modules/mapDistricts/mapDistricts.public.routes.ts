import type { FastifyInstance } from "fastify";
import { listMapDistrictsPublic } from "./mapDistricts.admin.service.js";

export async function publicMapDistrictsPlugin(fastify: FastifyInstance) {
  fastify.get("/map-districts", async (_req, reply) => {
    const rows = await listMapDistrictsPublic(fastify.db);
    return reply.send({ data: rows });
  });
}
