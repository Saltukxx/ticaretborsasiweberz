import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  databankConfigFromApp,
  listSyncRuns,
  runDatabankSync,
} from "./sync.service.js";

const triggerBodySchema = z.object({
  sections: z
    .array(z.enum(["home", "tescil", "charts", "volume"]))
    .optional(),
  dryRun: z.boolean().optional(),
});

export async function adminDatabankSyncPlugin(fastify: FastifyInstance) {
  fastify.addHook("preHandler", fastify.requireSuperAdmin);

  fastify.get("/runs", async (_req, reply) => {
    const runs = await listSyncRuns(fastify.db, 30);
    return reply.send({ data: runs });
  });

  fastify.post("/trigger", async (req, reply) => {
    const body = triggerBodySchema.safeParse(req.body ?? {});
    if (!body.success) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          details: body.error.flatten().fieldErrors,
        },
      });
    }

    const cfg = databankConfigFromApp(fastify.config);
    const result = await runDatabankSync(
      fastify.db,
      fastify.redis,
      fastify.config.redisPrefix,
      cfg,
      {
        sections: body.data.sections,
        dryRun: body.data.dryRun,
      },
    );

    const status = result.status === "success" ? 200 : 502;
    return reply.status(status).send({ data: result });
  });
}
