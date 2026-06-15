import type { FastifyInstance } from "fastify";
import {
  and,
  count,
  desc,
  eq,
  gte,
  ilike,
  lte,
  or,
  type SQL,
} from "drizzle-orm";
import { z } from "zod";
import { admins, auditLog } from "../../db/schema/index.js";

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  q: z.string().max(200).optional(),
  action: z.string().max(100).optional(),
  adminId: z.string().uuid().optional(),
  from: z.string().max(40).optional(),
  to: z.string().max(40).optional(),
});

function escapeLike(s: string): string {
  return s.replace(/[%_\\]/g, "\\$&");
}

export async function adminAuditPlugin(fastify: FastifyInstance) {
  fastify.addHook("preHandler", fastify.requireSuperAdmin);

  fastify.get("/audit-log", async (req, reply) => {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          details: parsed.error.flatten().fieldErrors,
        },
      });
    }
    const p = parsed.data;

    let fromDate: Date | undefined;
    let toDate: Date | undefined;
    if (p.from) {
      const d = new Date(p.from);
      if (Number.isNaN(d.getTime())) {
        return reply.status(400).send({
          error: { code: "VALIDATION_ERROR", message: "Geçersiz from" },
        });
      }
      fromDate = d;
    }
    if (p.to) {
      const d = new Date(p.to);
      if (Number.isNaN(d.getTime())) {
        return reply.status(400).send({
          error: { code: "VALIDATION_ERROR", message: "Geçersiz to" },
        });
      }
      toDate = d;
    }

    const parts: SQL[] = [];
    if (p.action) parts.push(eq(auditLog.action, p.action));
    if (p.adminId) parts.push(eq(auditLog.adminId, p.adminId));
    if (fromDate) parts.push(gte(auditLog.createdAt, fromDate));
    if (toDate) parts.push(lte(auditLog.createdAt, toDate));

    const term = p.q?.trim();
    if (term) {
      const like = `%${escapeLike(term)}%`;
      parts.push(
        or(
          ilike(auditLog.action, like),
          ilike(admins.email, like),
          ilike(admins.name, like),
        ) as SQL,
      );
    }

    const whereClause =
      parts.length === 0
        ? undefined
        : parts.length === 1
          ? parts[0]!
          : and(...parts);

    const countBase = fastify.db
      .select({ total: count() })
      .from(auditLog)
      .leftJoin(admins, eq(auditLog.adminId, admins.id));

    const [countRow] = await (whereClause
      ? countBase.where(whereClause)
      : countBase);

    const rows = await fastify.db
      .select({
        id: auditLog.id,
        adminId: auditLog.adminId,
        adminEmail: admins.email,
        adminName: admins.name,
        action: auditLog.action,
        entityType: auditLog.entityType,
        entityId: auditLog.entityId,
        diff: auditLog.diff,
        ipAddress: auditLog.ipAddress,
        createdAt: auditLog.createdAt,
      })
      .from(auditLog)
      .leftJoin(admins, eq(auditLog.adminId, admins.id))
      .where(whereClause)
      .orderBy(desc(auditLog.createdAt))
      .limit(p.limit)
      .offset(p.offset);

    return reply.send({
      data: rows,
      meta: {
        total: Number(countRow?.total ?? 0),
        limit: p.limit,
        offset: p.offset,
      },
    });
  });
}
