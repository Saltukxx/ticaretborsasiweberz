import type { FastifyInstance } from "fastify";
import {
  chatLogIdParamsSchema,
  chatLogListQuerySchema,
} from "./chatLogs.admin.schema.js";
import {
  CHAT_LOG_CSV_HEADERS,
  chatLogToCsvRow,
  getChatLogByIdAdmin,
  listChatLogsAdmin,
  listChatLogsForExport,
  toChatLogListItem,
} from "./chatLogs.admin.service.js";

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function adminChatLogsPlugin(fastify: FastifyInstance) {
  fastify.addHook("preHandler", fastify.requireAdminAuth);

  fastify.get("/chat-logs", async (req, reply) => {
    const parsed = chatLogListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          details: parsed.error.flatten().fieldErrors,
        },
      });
    }

    const { rows, total } = await listChatLogsAdmin(fastify.db, parsed.data);
    return reply.send({
      data: rows.map(toChatLogListItem),
      meta: {
        total,
        limit: parsed.data.limit,
        offset: parsed.data.offset,
      },
    });
  });

  fastify.get("/chat-logs/export", async (req, reply) => {
    const parsed = chatLogListQuerySchema
      .omit({ limit: true, offset: true })
      .safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          details: parsed.error.flatten().fieldErrors,
        },
      });
    }

    const rows = await listChatLogsForExport(fastify.db, parsed.data);
    const lines = [
      CHAT_LOG_CSV_HEADERS.join(","),
      ...rows.map((row) =>
        chatLogToCsvRow(row).map(csvEscape).join(","),
      ),
    ];

    void reply.header("Content-Type", "text/csv; charset=utf-8");
    void reply.header(
      "Content-Disposition",
      'attachment; filename="chat-logs.csv"',
    );
    return reply.send(`\uFEFF${lines.join("\n")}`);
  });

  fastify.get("/chat-logs/:id", async (req, reply) => {
    const params = chatLogIdParamsSchema.safeParse(req.params);
    if (!params.success) {
      return reply.status(400).send({
        error: { code: "VALIDATION_ERROR", message: "Geçersiz id" },
      });
    }

    const row = await getChatLogByIdAdmin(fastify.db, params.data.id);
    if (!row) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Kayıt bulunamadı" },
      });
    }

    return reply.send({ data: row });
  });
}
