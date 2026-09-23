import type { FastifyInstance, FastifyReply } from "fastify";
import rateLimit from "@fastify/rate-limit";
import { getClientIp } from "../../lib/clientIp.js";
import {
  endSseReply,
  endSseReplyOnAbort,
  initSseReply,
  isAbortError,
  writeSseEvent,
} from "../../lib/sseReply.js";
import { collectChatRequestMeta } from "../chatLogs/chatLogs.collectMeta.js";
import { logChatConversation } from "../chatLogs/chatLogs.service.js";
import {
  handleSiteChatMessage,
  streamSiteChatMessage,
} from "./siteChat.service.js";
import { siteChatBodySchema } from "./siteChat.schema.js";

function wantsStream(req: { query: unknown }): boolean {
  const q = req.query as { stream?: string };
  return q.stream === "1" || q.stream === "true";
}

function sendSiteChatError(
  reply: FastifyReply,
  status: number,
  code: string,
  message: string,
  stream: boolean,
): FastifyReply | void {
  if (stream) {
    initSseReply(reply);
    writeSseEvent(reply, "error", { code, message });
    endSseReply(reply);
    return;
  }
  return reply.status(status).send({ error: { code, message } });
}

export async function publicSiteChatPlugin(fastify: FastifyInstance) {
  await fastify.register(
    async (scope) => {
      await scope.register(rateLimit, {
        max: 20,
        timeWindow: 15 * 60 * 1000,
        keyGenerator: (req) => getClientIp(req),
      });

      scope.post("/site-chat", async (req, reply) => {
        const stream = wantsStream(req);
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
          if (stream) {
            initSseReply(reply);
            writeSseEvent(reply, "error", {
              code: "VALIDATION_ERROR",
              message: "Geçersiz istek gövdesi",
            });
            endSseReply(reply);
            return;
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
        const abort = new AbortController();
        req.raw.on("close", () => abort.abort());

        const chatOptions = {
          message,
          history,
          geminiApiKey: fastify.config.geminiApiKey,
          geminiModel: fastify.config.geminiModel,
          maxOutputTokens: fastify.config.geminiMaxOutputTokens,
          signal: abort.signal,
        };

        if (stream) {
          initSseReply(reply);

          try {
            const result = await streamSiteChatMessage(
              fastify.db,
              fastify.redis,
              fastify.config.redisPrefix,
              { ...chatOptions, signal: abort.signal },
              { delta: (text) => writeSseEvent(reply, "delta", { text }) },
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
              writeSseEvent(reply, "error", {
                code: result.code.toUpperCase(),
                message: result.message,
              });
              endSseReply(reply);
              return;
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

            writeSseEvent(reply, "done", { reply: result.reply, path: result.path });
            endSseReply(reply);
            return;
          } catch (err) {
            if (isAbortError(err)) {
              endSseReplyOnAbort(reply);
              return;
            }
            throw err;
          }
        }

        const result = await handleSiteChatMessage(
          fastify.db,
          fastify.redis,
          fastify.config.redisPrefix,
          chatOptions,
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
            return sendSiteChatError(
              reply,
              503,
              "GEMINI_NOT_CONFIGURED",
              result.message,
              false,
            );
          }
          return sendSiteChatError(reply, 502, "GEMINI_ERROR", result.message, false);
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
