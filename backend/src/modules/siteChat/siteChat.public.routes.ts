import type { FastifyInstance } from "fastify";
import rateLimit from "@fastify/rate-limit";
import { getClientIp } from "../../lib/clientIp.js";
import { collectChatRequestMeta } from "../chatLogs/chatLogs.collectMeta.js";
import { logChatConversation } from "../chatLogs/chatLogs.service.js";
import { handleSiteChatMessage } from "./siteChat.service.js";
import { siteChatBodySchema } from "./siteChat.schema.js";

export async function publicSiteChatPlugin(fastify: FastifyInstance) {
  await fastify.register(
    async (scope) => {
      await scope.register(rateLimit, {
        max: 20,
        timeWindow: 15 * 60 * 1000,
        keyGenerator: (req) => getClientIp(req),
      });

      scope.post("/site-chat", async (req, reply) => {
        const meta = collectChatRequestMeta(req);
        const parsed = siteChatBodySchema.safeParse(req.body);

        if (!parsed.success) {
          const raw = req.body as { message?: string; history?: unknown[] } | undefined;
          if (typeof raw?.message === "string" && raw.message.trim()) {
            logChatConversation(
              fastify.db,
              {
                channel: "site_chat",
                sessionId:
                  typeof (raw as { sessionId?: string }).sessionId === "string"
                    ? (raw as { sessionId: string }).sessionId
                    : null,
                userMessage: raw.message.trim().slice(0, 1000),
                history: Array.isArray(raw.history) ? raw.history : [],
                outcome: "validation_error",
                errorCode: "VALIDATION_ERROR",
                meta,
              },
              (err) => fastify.log.warn({ err }, "site_chat log kaydedilemedi"),
            );
          }
          return reply.status(400).send({
            error: {
              code: "VALIDATION_ERROR",
              message: "Geçersiz istek gövdesi",
              details: parsed.error.flatten().fieldErrors,
            },
          });
        }

        const { message, history, sessionId } = parsed.data;

        const result = await handleSiteChatMessage(
          fastify.db,
          fastify.redis,
          fastify.config.redisPrefix,
          {
            message,
            history,
            geminiApiKey: fastify.config.geminiApiKey,
            geminiModel: fastify.config.geminiModel,
          },
        );

        if (!result.ok) {
          logChatConversation(
            fastify.db,
            {
              channel: "site_chat",
              sessionId: sessionId ?? null,
              userMessage: message,
              botReply: result.message,
              history,
              outcome: "error",
              errorCode: result.code.toUpperCase(),
              meta,
            },
            (err) => fastify.log.warn({ err }, "site_chat log kaydedilemedi"),
          );

          if (result.code === "gemini_not_configured") {
            return reply.status(503).send({
              error: {
                code: "GEMINI_NOT_CONFIGURED",
                message: result.message,
              },
            });
          }
          return reply.status(502).send({
            error: {
              code: "GEMINI_ERROR",
              message: result.message,
            },
          });
        }

        logChatConversation(
          fastify.db,
          {
            channel: "site_chat",
            sessionId: sessionId ?? null,
            userMessage: message,
            botReply: result.reply,
            history,
            outcome: "ok",
            path: result.path,
            meta,
          },
          (err) => fastify.log.warn({ err }, "site_chat log kaydedilemedi"),
        );

        return reply.send({ data: { reply: result.reply, path: result.path } });
      });
    },
    { prefix: "" },
  );
}
