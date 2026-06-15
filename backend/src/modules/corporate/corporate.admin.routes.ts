import type { FastifyInstance } from "fastify";
import { getClientIp } from "../../lib/clientIp.js";
import { writeAudit } from "../../lib/audit.js";
import {
  createMilestone,
  deleteMilestone,
  getCorporateProfileAdmin,
  getMilestoneByIdAdmin,
  listCorporateMilestonesAdmin,
  patchCorporateProfile,
  patchMilestone,
} from "./corporate.admin.service.js";
import {
  getCorporateDocumentByIdAdmin,
  listCorporateDocumentsAdmin,
  patchCorporateDocumentAdmin,
} from "./corporate.documents.admin.service.js";
import {
  corporateDocumentIdParamsSchema,
  createMilestoneBodySchema,
  milestoneIdParamsSchema,
  patchCorporateDocumentBodySchema,
  patchCorporateProfileBodySchema,
  patchMilestoneBodySchema,
} from "./corporate.admin.schema.js";

export async function adminCorporatePlugin(fastify: FastifyInstance) {
  fastify.addHook("preHandler", fastify.requireAdminAuth);

  fastify.get("/profile", async (_req, reply) => {
    const profile = await getCorporateProfileAdmin(fastify.db);
    return reply.send({ data: profile });
  });

  fastify.patch("/profile", async (req, reply) => {
    const body = patchCorporateProfileBodySchema.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          details: body.error.flatten().fieldErrors,
        },
      });
    }
    const row = await patchCorporateProfile(fastify.db, body.data);
    await writeAudit(fastify.db, {
      adminId: req.adminAuth!.sub,
      action: "corporate.profile.update",
      entityType: "corporate_profile",
      entityId: row.id,
      diff: { patch: body.data },
      ip: getClientIp(req),
    });
    return reply.send({ data: row });
  });

  fastify.get("/milestones", async (_req, reply) => {
    const rows = await listCorporateMilestonesAdmin(fastify.db);
    return reply.send({ data: rows });
  });

  fastify.post("/milestones", async (req, reply) => {
    const body = createMilestoneBodySchema.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          details: body.error.flatten().fieldErrors,
        },
      });
    }
    const row = await createMilestone(fastify.db, body.data);
    await writeAudit(fastify.db, {
      adminId: req.adminAuth!.sub,
      action: "corporate.milestone.create",
      entityType: "corporate_milestones",
      entityId: row.id,
      diff: { after: { title: row.title } },
      ip: getClientIp(req),
    });
    return reply.status(201).send({ data: row });
  });

  fastify.get("/milestones/:id", async (req, reply) => {
    const params = milestoneIdParamsSchema.safeParse(req.params);
    if (!params.success) {
      return reply.status(400).send({ error: { code: "VALIDATION_ERROR" } });
    }
    const row = await getMilestoneByIdAdmin(fastify.db, params.data.id);
    if (!row) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Kayıt bulunamadı." },
      });
    }
    return reply.send({ data: row });
  });

  fastify.patch("/milestones/:id", async (req, reply) => {
    const params = milestoneIdParamsSchema.safeParse(req.params);
    const body = patchMilestoneBodySchema.safeParse(req.body);
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
    const result = await patchMilestone(fastify.db, params.data.id, body.data);
    if (!result.ok) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Kayıt bulunamadı." },
      });
    }
    await writeAudit(fastify.db, {
      adminId: req.adminAuth!.sub,
      action: "corporate.milestone.update",
      entityType: "corporate_milestones",
      entityId: result.row.id,
      diff: { patch: body.data },
      ip: getClientIp(req),
    });
    return reply.send({ data: result.row });
  });

  fastify.delete("/milestones/:id", async (req, reply) => {
    const params = milestoneIdParamsSchema.safeParse(req.params);
    if (!params.success) {
      return reply.status(400).send({ error: { code: "VALIDATION_ERROR" } });
    }
    const removed = await deleteMilestone(fastify.db, params.data.id);
    if (!removed) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Kayıt bulunamadı." },
      });
    }
    await writeAudit(fastify.db, {
      adminId: req.adminAuth!.sub,
      action: "corporate.milestone.delete",
      entityType: "corporate_milestones",
      entityId: removed.id,
      ip: getClientIp(req),
    });
    return reply.status(204).send();
  });

  fastify.get("/documents", async (_req, reply) => {
    const rows = await listCorporateDocumentsAdmin(fastify.db);
    return reply.send({ data: rows, meta: { total: rows.length } });
  });

  fastify.get("/documents/:id", async (req, reply) => {
    const params = corporateDocumentIdParamsSchema.safeParse(req.params);
    if (!params.success) {
      return reply.status(400).send({ error: { code: "VALIDATION_ERROR" } });
    }
    const row = await getCorporateDocumentByIdAdmin(fastify.db, params.data.id);
    if (!row) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Belge bulunamadı." },
      });
    }
    return reply.send({ data: row });
  });

  fastify.patch("/documents/:id", async (req, reply) => {
    const params = corporateDocumentIdParamsSchema.safeParse(req.params);
    const body = patchCorporateDocumentBodySchema.safeParse(req.body);
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
    const result = await patchCorporateDocumentAdmin(
      fastify.db,
      params.data.id,
      body.data,
    );
    if (!result.ok) {
      const status = result.error === "NOT_FOUND" ? 404 : 400;
      return reply.status(status).send({
        error: {
          code: result.error,
          message:
            result.error === "NOT_FOUND"
              ? "Belge bulunamadı."
              : "Geçersiz kategori.",
        },
      });
    }
    await writeAudit(fastify.db, {
      adminId: req.adminAuth!.sub,
      action: "corporate.document.update",
      entityType: "corporate_documents",
      entityId: result.row.id,
      diff: { patch: body.data },
      ip: getClientIp(req),
    });
    return reply.send({ data: result.row });
  });
}
