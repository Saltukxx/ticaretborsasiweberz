import type { FastifyInstance } from "fastify";
import { getClientIp } from "../../lib/clientIp.js";
import { writeAudit } from "../../lib/audit.js";
import {
  getMapDistrictBySlugAdmin,
  listMapDistrictsAdmin,
  patchMapDistrict,
} from "./mapDistricts.admin.service.js";
import {
  mapDistrictSlugParamsSchema,
  patchMapDistrictBodySchema,
} from "./mapDistricts.admin.schema.js";

export async function adminMapDistrictsPlugin(fastify: FastifyInstance) {
  fastify.addHook("preHandler", fastify.requireAdminAuth);

  fastify.get("/", async (_req, reply) => {
    const rows = await listMapDistrictsAdmin(fastify.db);
    return reply.send({ data: rows });
  });

  fastify.get("/:slug", async (req, reply) => {
    const params = mapDistrictSlugParamsSchema.safeParse(req.params);
    if (!params.success) {
      return reply.status(400).send({ error: { code: "VALIDATION_ERROR" } });
    }
    const row = await getMapDistrictBySlugAdmin(fastify.db, params.data.slug);
    if (!row) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Kayıt bulunamadı." },
      });
    }
    return reply.send({ data: row });
  });

  fastify.patch("/:slug", async (req, reply) => {
    const params = mapDistrictSlugParamsSchema.safeParse(req.params);
    const body = patchMapDistrictBodySchema.safeParse(req.body);
    if (!params.success || !body.success) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          details: !params.success
            ? params.error.flatten().fieldErrors
            : body.error!.flatten().fieldErrors,
        },
      });
    }
    const result = await patchMapDistrict(
      fastify.db,
      params.data.slug,
      body.data,
    );
    if (!result.ok) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Kayıt bulunamadı." },
      });
    }

    await writeAudit(fastify.db, {
      adminId: req.adminAuth!.sub,
      action: "map_district.update",
      entityType: "map_districts",
      entityId: result.row.slug,
      diff: { patch: body.data },
      ip: getClientIp(req),
    });

    return reply.send({ data: result.row });
  });
}
