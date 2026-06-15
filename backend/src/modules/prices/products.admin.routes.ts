import type { FastifyInstance } from "fastify";
import { getClientIp } from "../../lib/clientIp.js";
import { writeAudit } from "../../lib/audit.js";
import { invalidatePricesPublicCache } from "../../lib/pricesCache.js";
import {
  createProduct,
  getProductById,
  listProductsAdmin,
  patchProduct,
} from "./products.admin.service.js";
import {
  createProductBodySchema,
  patchProductBodySchema,
  productIdParamsSchema,
  productsListQuerySchema,
} from "./prices.admin.schema.js";

export async function adminProductsPlugin(fastify: FastifyInstance) {
  fastify.addHook("preHandler", fastify.requireAdminAuth);

  fastify.get("/", async (req, reply) => {
    const q = productsListQuerySchema.safeParse(req.query);
    if (!q.success) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          details: q.error.flatten().fieldErrors,
        },
      });
    }
    const activeOnly = q.data.activeOnly === "true";
    const rows = await listProductsAdmin(fastify.db, {
      q: q.data.q,
      activeOnly,
    });
    return reply.send({ data: rows });
  });

  fastify.post("/", async (req, reply) => {
    const body = createProductBodySchema.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          details: body.error!.flatten().fieldErrors,
        },
      });
    }
    const adminId = req.adminAuth!.sub;
    const result = await createProduct(fastify.db, body.data);
    if (!result.ok) {
      if (result.code === "INVALID_SLUG") {
        return reply.status(400).send({
          error: {
            code: "INVALID_SLUG",
            message: "Slug yalnızca küçük harf, rakam ve tire içerebilir.",
          },
        });
      }
      return reply.status(409).send({
        error: {
          code: "SLUG_TAKEN",
          message: "Bu ürün kodu (slug) zaten kullanılıyor.",
        },
      });
    }

    await writeAudit(fastify.db, {
      adminId,
      action: "products.create",
      entityType: "commodity_products",
      entityId: result.row.id,
      diff: { after: { slug: result.row.slug } },
      ip: getClientIp(req),
    });
    await invalidatePricesPublicCache(
      fastify.redis,
      fastify.config.redisPrefix,
    );

    return reply.status(201).send({ data: result.row });
  });

  fastify.get("/:id", async (req, reply) => {
    const params = productIdParamsSchema.safeParse(req.params);
    if (!params.success) {
      return reply.status(400).send({ error: { code: "VALIDATION_ERROR" } });
    }
    const row = await getProductById(fastify.db, params.data.id);
    if (!row) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Ürün bulunamadı." },
      });
    }
    return reply.send({ data: row });
  });

  fastify.patch("/:id", async (req, reply) => {
    const params = productIdParamsSchema.safeParse(req.params);
    const body = patchProductBodySchema.safeParse(req.body);
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
    const adminId = req.adminAuth!.sub;
    const result = await patchProduct(fastify.db, params.data.id, body.data);
    if (!result.ok) {
      if (result.code === "NOT_FOUND") {
        return reply.status(404).send({
          error: { code: "NOT_FOUND", message: "Ürün bulunamadı." },
        });
      }
      if (result.code === "INVALID_SLUG") {
        return reply.status(400).send({
          error: { code: "INVALID_SLUG", message: "Geçersiz slug." },
        });
      }
      return reply.status(409).send({
        error: { code: "SLUG_TAKEN", message: "Slug kullanımda." },
      });
    }

    await writeAudit(fastify.db, {
      adminId,
      action: "products.update",
      entityType: "commodity_products",
      entityId: result.row.id,
      diff: { patch: body.data },
      ip: getClientIp(req),
    });
    await invalidatePricesPublicCache(
      fastify.redis,
      fastify.config.redisPrefix,
    );

    return reply.send({ data: result.row });
  });
}
