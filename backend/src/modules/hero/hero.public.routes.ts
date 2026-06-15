import type { FastifyInstance } from "fastify";
import { getHeroContentPublic } from "./hero.admin.service.js";

export async function publicHeroPlugin(fastify: FastifyInstance) {
  fastify.get("/hero", async (_req, reply) => {
    const content = await getHeroContentPublic(fastify.db);
    return reply.send({ data: content });
  });
}
