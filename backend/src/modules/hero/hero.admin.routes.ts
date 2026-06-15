import type { FastifyInstance } from "fastify";
import { getClientIp } from "../../lib/clientIp.js";
import { writeAudit } from "../../lib/audit.js";
import { getHeroContentAdmin, patchHeroContent } from "./hero.admin.service.js";
import { patchHeroContentBodySchema } from "./hero.admin.schema.js";

export async function adminHeroPlugin(fastify: FastifyInstance) {
  fastify.addHook("preHandler", fastify.requireAdminAuth);

  fastify.get("/", async (_req, reply) => {
    const content = await getHeroContentAdmin(fastify.db);
    return reply.send({ data: content });
  });

  fastify.patch("/", async (req, reply) => {
    const body = patchHeroContentBodySchema.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          details: body.error.flatten().fieldErrors,
        },
      });
    }
    const row = await patchHeroContent(fastify.db, body.data);
    await writeAudit(fastify.db, {
      adminId: req.adminAuth!.sub,
      action: "hero.update",
      entityType: "hero_content",
      entityId: row.id,
      diff: { patch: body.data },
      ip: getClientIp(req),
    });
    return reply.send({ data: row });
  });
}
