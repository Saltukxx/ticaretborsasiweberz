import type { FastifyInstance } from "fastify";
import { getClientIp } from "../../lib/clientIp.js";
import rateLimit from "@fastify/rate-limit";
import {
  GeminiRecipeError,
  generateRecipeChatReply,
} from "../../lib/geminiRecipe.js";
import { collectChatRequestMeta } from "../chatLogs/chatLogs.collectMeta.js";
import { logChatConversation } from "../chatLogs/chatLogs.service.js";
import { recipeChatBodySchema } from "./recipeChat.schema.js";

export async function publicRecipeChatPlugin(fastify: FastifyInstance) {
  await fastify.register(
    async (scope) => {
      await scope.register(rateLimit, {
        max: 20,
        timeWindow: 15 * 60 * 1000,
        keyGenerator: (req) => getClientIp(req),
      });

      scope.post("/recipe-chat", async (req, reply) => {
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

        try {
          const replyText = await generateRecipeChatReply({
            apiKey,
            model: fastify.config.geminiModel,
            history,
            userMessage: message,
            currentStep,
            videoState,
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

          return reply.send({ data: { reply: replyText } });
        } catch (err) {
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
            const status = err.code === "blocked" ? 422 : 502;
            return reply.status(status).send({
              error: {
                code: `GEMINI_${err.code.toUpperCase()}`,
                message: err.message,
              },
            });
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
