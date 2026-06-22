import type { FastifyInstance, FastifyReply } from "fastify";
import { getClientIp } from "../../lib/clientIp.js";
import rateLimit from "@fastify/rate-limit";
import {
  GeminiRecipeError,
  generateRecipeChatReply,
  streamRecipeChatReply,
} from "../../lib/geminiRecipe.js";
import { endSseReply, initSseReply, writeSseEvent } from "../../lib/sseReply.js";
import { collectChatRequestMeta } from "../chatLogs/chatLogs.collectMeta.js";
import { logChatConversation } from "../chatLogs/chatLogs.service.js";
import { recipeChatBodySchema } from "./recipeChat.schema.js";

function wantsStream(req: { query: unknown }): boolean {
  const q = req.query as { stream?: string };
  return q.stream === "1" || q.stream === "true";
}

function geminiErrorStatus(code: GeminiRecipeError["code"]): number {
  return code === "blocked" ? 422 : 502;
}

function sendRecipeGeminiError(
  reply: FastifyReply,
  err: GeminiRecipeError,
  stream: boolean,
): FastifyReply | void {
  const apiCode = `GEMINI_${err.code.toUpperCase()}`;
  if (stream) {
    initSseReply(reply);
    writeSseEvent(reply, "error", { code: apiCode, message: err.message });
    endSseReply(reply);
    return;
  }
  return reply.status(geminiErrorStatus(err.code)).send({
    error: { code: apiCode, message: err.message },
  });
}

export async function publicRecipeChatPlugin(fastify: FastifyInstance) {
  await fastify.register(
    async (scope) => {
      await scope.register(rateLimit, {
        max: 20,
        timeWindow: 15 * 60 * 1000,
        keyGenerator: (req) => getClientIp(req),
      });

      scope.post("/recipe-chat", async (req, reply) => {
        const stream = wantsStream(req);
        const meta = collectChatRequestMeta(req);
        const parsed = recipeChatBodySchema.safeParse(req.body);

        if (!parsed.success) {
          const raw = req.body as { message?: string; history?: unknown[] } | undefined;
          if (typeof raw?.message === "string" && raw.message.trim()) {
            logChatConversation(
              fastify.db,
              {
                channel: "recipe_chat",
                sessionId:
                  typeof (raw as { sessionId?: string }).sessionId === "string"
                    ? (raw as { sessionId: string }).sessionId
                    : null,
                userMessage: raw.message.trim().slice(0, 2000),
                history: Array.isArray(raw.history) ? raw.history : [],
                outcome: "validation_error",
                errorCode: "VALIDATION_ERROR",
                meta,
              },
              (err) => fastify.log.warn({ err }, "recipe_chat log kaydedilemedi"),
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

        const apiKey = fastify.config.geminiApiKey;
        if (!apiKey) {
          logChatConversation(
            fastify.db,
            {
              channel: "recipe_chat",
              sessionId: parsed.data.sessionId ?? null,
              userMessage: parsed.data.message,
              history: parsed.data.history,
              outcome: "error",
              errorCode: "GEMINI_NOT_CONFIGURED",
              context: {
                currentStep: parsed.data.currentStep ?? null,
                videoState: parsed.data.videoState ?? null,
              },
              meta,
            },
            (err) => fastify.log.warn({ err }, "recipe_chat log kaydedilemedi"),
          );
          if (stream) {
            initSseReply(reply);
            writeSseEvent(reply, "error", {
              code: "GEMINI_NOT_CONFIGURED",
              message: "Yapay zekâ sohbeti şu an kullanılamıyor.",
            });
            endSseReply(reply);
            return;
          }
          return reply.status(503).send({
            error: {
              code: "GEMINI_NOT_CONFIGURED",
              message: "Yapay zekâ sohbeti şu an kullanılamıyor.",
            },
          });
        }

        const { message, history, currentStep, videoState, sessionId } =
          parsed.data;
        const context = {
          currentStep: currentStep ?? null,
          videoState: videoState ?? null,
        };

        const abort = new AbortController();
        req.raw.on("close", () => abort.abort());

        const chatBase = {
          apiKey,
          model: fastify.config.geminiModel,
          history,
          userMessage: message,
          currentStep,
          videoState,
          maxOutputTokens: fastify.config.geminiMaxOutputTokens,
          signal: abort.signal,
        };

        try {
          if (stream) {
            initSseReply(reply);
            const replyText = await streamRecipeChatReply({
              ...chatBase,
              onDelta: (text) => writeSseEvent(reply, "delta", { text }),
            });

            logChatConversation(
              fastify.db,
              {
                channel: "recipe_chat",
                sessionId: sessionId ?? null,
                userMessage: message,
                botReply: replyText,
                history,
                outcome: "ok",
                context,
                meta,
              },
              (err) => fastify.log.warn({ err }, "recipe_chat log kaydedilemedi"),
            );

            writeSseEvent(reply, "done", { reply: replyText });
            endSseReply(reply);
            return;
          }

          const replyText = await generateRecipeChatReply(chatBase);

          logChatConversation(
            fastify.db,
            {
              channel: "recipe_chat",
              sessionId: sessionId ?? null,
              userMessage: message,
              botReply: replyText,
              history,
              outcome: "ok",
              context,
              meta,
            },
            (err) => fastify.log.warn({ err }, "recipe_chat log kaydedilemedi"),
          );

          return reply.send({ data: { reply: replyText } });
        } catch (err) {
          if (err instanceof Error && err.name === "AbortError") {
            endSseReply(reply);
            return;
          }
          if (err instanceof GeminiRecipeError) {
            const outcome = err.code === "blocked" ? "blocked" : "error";
            logChatConversation(
              fastify.db,
              {
                channel: "recipe_chat",
                sessionId: sessionId ?? null,
                userMessage: message,
                botReply: err.message,
                history,
                outcome,
                errorCode: `GEMINI_${err.code.toUpperCase()}`,
                context,
                meta,
              },
              (e) => fastify.log.warn({ err: e }, "recipe_chat log kaydedilemedi"),
            );
            return sendRecipeGeminiError(reply, err, stream);
          }

          logChatConversation(
            fastify.db,
            {
              channel: "recipe_chat",
              sessionId: sessionId ?? null,
              userMessage: message,
              history,
              outcome: "error",
              errorCode: "INTERNAL_ERROR",
              context,
              meta,
            },
            (e) => fastify.log.warn({ err: e }, "recipe_chat log kaydedilemedi"),
          );
          throw err;
        }
      });
    },
    { prefix: "" },
  );
}
