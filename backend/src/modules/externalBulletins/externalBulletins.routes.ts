import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getCached } from "../../lib/cache.js";
import {
  fetchAllExternalBulletins,
  fetchOneExternalBulletin,
} from "./externalBulletins.service.js";
import { getExternalSource } from "./sources.js";

const EXTERNAL_BULLETINS_CACHE_TTL_SEC = 300;

function externalBulletinsCacheKey(prefix: string, sourceId?: string): string {
  const day = new Date().toISOString().slice(0, 10);
  return sourceId
    ? `${prefix}:external-bulletins:${sourceId}:${day}`
    : `${prefix}:external-bulletins:all:${day}`;
}

const sourceParamsSchema = z.object({
  sourceId: z.string().min(1).max(40),
});

export async function publicExternalBulletinsPlugin(fastify: FastifyInstance) {
  fastify.get("/prices/external-bulletins", async (_req, reply) => {
    const prefix = fastify.config.redisPrefix;
    const key = externalBulletinsCacheKey(prefix);
    const data = await getCached(
      fastify.redis,
      key,
      EXTERNAL_BULLETINS_CACHE_TTL_SEC,
      () => fetchAllExternalBulletins(),
    );
    return reply.send({ data });
  });

  fastify.get("/prices/external-bulletins/:sourceId", async (req, reply) => {
    const params = sourceParamsSchema.safeParse(req.params);
    if (!params.success || !getExternalSource(params.data.sourceId)) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Borsa kaynağı bulunamadı" },
      });
    }
    const sourceId = params.data.sourceId;
    const prefix = fastify.config.redisPrefix;
    const key = externalBulletinsCacheKey(prefix, sourceId);
    const data = await getCached(
      fastify.redis,
      key,
      EXTERNAL_BULLETINS_CACHE_TTL_SEC,
      () => fetchOneExternalBulletin(sourceId),
    );
    return reply.send({ data });
  });
}
