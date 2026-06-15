import type { FastifyInstance } from "fastify";
import { assertSuperAdmin } from "../../plugins/adminAuth.js";
import { getClientIp } from "../../lib/clientIp.js";
import { writeAudit } from "../../lib/audit.js";
import { newsletterUnsubscribeUrl } from "../../lib/newsletterToken.js";
import {
  adminContactSubmissionsQuerySchema,
  adminNewsletterQuerySchema,
  contactSubmissionIdParamsSchema,
  legalSlugParamsSchema,
  patchContactSubmissionBodySchema,
  patchLegalPageBodySchema,
  patchSiteContactBodySchema,
} from "./site.schema.js";
import {
  getContactSubmissionByIdAdmin,
  getLegalPageBySlugAdmin,
  getSiteContactAdmin,
  listAllNewsletterSubscribersForExport,
  listContactSubmissionsAdmin,
  listLegalPagesAdmin,
  listNewsletterSubscribersAdmin,
  patchContactSubmissionStatus,
  patchLegalPage,
  patchSiteContact,
} from "./site.service.js";

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function adminSitePlugin(fastify: FastifyInstance) {
  fastify.addHook("preHandler", fastify.requireAdminAuth);

  fastify.get("/site/contact", async (_req, reply) => {
    const data = await getSiteContactAdmin(fastify.db);
    return reply.send({ data });
  });

  fastify.patch("/site/contact", async (req, reply) => {
    const body = patchSiteContactBodySchema.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          details: body.error.flatten().fieldErrors,
        },
      });
    }
    const row = await patchSiteContact(fastify.db, body.data);
    await writeAudit(fastify.db, {
      adminId: req.adminAuth!.sub,
      action: "site.contact.update",
      entityType: "corporate_profile",
      entityId: row.id,
      diff: { patch: body.data },
      ip: getClientIp(req),
    });
    const data = await getSiteContactAdmin(fastify.db);
    return reply.send({ data });
  });

  fastify.get("/contact-submissions", async (req, reply) => {
    const parsed = adminContactSubmissionsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          details: parsed.error.flatten().fieldErrors,
        },
      });
    }
    const { rows, total } = await listContactSubmissionsAdmin(
      fastify.db,
      parsed.data,
    );
    return reply.send({
      data: rows,
      meta: { total, limit: parsed.data.limit, offset: parsed.data.offset },
    });
  });

  fastify.get("/contact-submissions/:id", async (req, reply) => {
    const params = contactSubmissionIdParamsSchema.safeParse(req.params);
    if (!params.success) {
      return reply.status(400).send({ error: { code: "VALIDATION_ERROR" } });
    }
    const row = await getContactSubmissionByIdAdmin(
      fastify.db,
      params.data.id,
    );
    if (!row) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Kayıt bulunamadı." },
      });
    }
    return reply.send({ data: row });
  });

  fastify.patch("/contact-submissions/:id", async (req, reply) => {
    const params = contactSubmissionIdParamsSchema.safeParse(req.params);
    const body = patchContactSubmissionBodySchema.safeParse(req.body);
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
    const row = await patchContactSubmissionStatus(
      fastify.db,
      params.data.id,
      body.data.status,
    );
    if (!row) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Kayıt bulunamadı." },
      });
    }
    await writeAudit(fastify.db, {
      adminId: req.adminAuth!.sub,
      action: "contact_submission.update",
      entityType: "contact_submissions",
      entityId: row.id,
      diff: { status: body.data.status },
      ip: getClientIp(req),
    });
    return reply.send({ data: row });
  });

  fastify.get("/newsletter-subscribers", async (req, reply) => {
    const parsed = adminNewsletterQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          details: parsed.error.flatten().fieldErrors,
        },
      });
    }
    const { rows, total } = await listNewsletterSubscribersAdmin(
      fastify.db,
      parsed.data,
    );
    return reply.send({
      data: rows,
      meta: { total, limit: parsed.data.limit, offset: parsed.data.offset },
    });
  });

  fastify.get("/newsletter-subscribers/export", async (req, reply) => {
    if (!(await assertSuperAdmin(req, reply))) return;
    const statusParam =
      typeof req.query === "object" &&
      req.query !== null &&
      "status" in req.query &&
      typeof (req.query as { status?: string }).status === "string"
        ? (req.query as { status: string }).status
        : "active";
    const status =
      statusParam === "unsubscribed" || statusParam === "all"
        ? statusParam
        : "active";
    const rows = await listAllNewsletterSubscribersForExport(
      fastify.db,
      status,
    );
    const header = "email,frequency,status,created_at,unsubscribe_url\n";
    const lines = rows.map(
      (r) =>
        `${csvEscape(r.email)},${csvEscape(r.frequency)},${csvEscape(r.status)},${r.createdAt.toISOString()},${csvEscape(
          newsletterUnsubscribeUrl(
            process.env.SITE_URL?.trim() ||
              fastify.config.baseUrl ||
              "https://www.erzurumtb.org.tr",
            fastify.config.jwtSecret,
            r.email,
          ),
        )}`,
    );
    void reply.header("Content-Type", "text/csv; charset=utf-8");
    void reply.header(
      "Content-Disposition",
      'attachment; filename="newsletter-subscribers.csv"',
    );
    return reply.send(header + lines.join("\n"));
  });

  fastify.get("/legal-pages", async (_req, reply) => {
    const rows = await listLegalPagesAdmin(fastify.db);
    return reply.send({ data: rows });
  });

  fastify.get("/legal-pages/:slug", async (req, reply) => {
    const params = legalSlugParamsSchema.safeParse(req.params);
    if (!params.success) {
      return reply.status(400).send({ error: { code: "VALIDATION_ERROR" } });
    }
    const row = await getLegalPageBySlugAdmin(fastify.db, params.data.slug);
    if (!row) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Sayfa bulunamadı." },
      });
    }
    return reply.send({ data: row });
  });

  fastify.patch("/legal-pages/:slug", async (req, reply) => {
    const params = legalSlugParamsSchema.safeParse(req.params);
    const body = patchLegalPageBodySchema.safeParse(req.body);
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
    const row = await patchLegalPage(fastify.db, params.data.slug, body.data);
    if (!row) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Sayfa bulunamadı." },
      });
    }
    await writeAudit(fastify.db, {
      adminId: req.adminAuth!.sub,
      action: "legal_page.update",
      entityType: "legal_pages",
      entityId: row.slug,
      diff: { patch: body.data },
      ip: getClientIp(req),
    });
    return reply.send({ data: row });
  });
}
