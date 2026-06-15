import type { FastifyInstance } from "fastify";
import { getCorporatePublic } from "./corporate.admin.service.js";
import { publicCorporateDocumentsRoutes } from "./corporate.documents.routes.js";

export async function publicCorporatePlugin(fastify: FastifyInstance) {
  fastify.get("/corporate", async (_req, reply) => {
    const payload = await getCorporatePublic(fastify.db);
    return reply.send({ data: payload });
  });

  await fastify.register(publicCorporateDocumentsRoutes);
}
