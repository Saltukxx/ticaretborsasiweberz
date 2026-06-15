import type { Database } from "../../db/connection.js";
import type { RedisClient } from "../../lib/redis.js";
import {
  GeminiSiteChatError,
  generateSiteChatReply,
} from "../../lib/geminiSiteChat.js";
import { fetchBulletinPayload } from "../prices/prices.public.service.js";
import { fetchSiteChatCmsContext } from "./siteChat.cmsFetch.js";
import {
  CMS_FALLBACK_REPLY,
  buildSiteChatSystemInstruction,
} from "./siteChat.context.js";
import { buildPriceReply } from "./siteChat.priceHandler.js";
import {
  OFF_TOPIC_REPLY,
  OUT_OF_SCOPE_REPLY,
  classifySiteChatIntent,
} from "./siteChat.router.js";
import type { SiteChatHistoryTurn } from "./siteChat.schema.js";

export type SiteChatResult =
  | { ok: true; reply: string; path: "price" | "cms" | "static" }
  | { ok: false; code: "gemini_not_configured" | "gemini_error"; message: string };

export async function handleSiteChatMessage(
  db: Database,
  redis: RedisClient | null,
  redisPrefix: string,
  options: {
    message: string;
    history: SiteChatHistoryTurn[];
    geminiApiKey?: string;
    geminiModel: string;
  },
): Promise<SiteChatResult> {
  const intent = classifySiteChatIntent(options.message);

  if (intent === "off_topic") {
    return { ok: true, reply: OFF_TOPIC_REPLY, path: "static" };
  }

  if (intent === "out_of_scope") {
    return { ok: true, reply: OUT_OF_SCOPE_REPLY, path: "static" };
  }

  if (intent === "price") {
    const bulletin = await fetchBulletinPayload(db, redis, redisPrefix);
    const reply = buildPriceReply(
      options.message,
      bulletin.sessionDate,
      bulletin.rows,
    );
    return { ok: true, reply, path: "price" };
  }

  if (!options.geminiApiKey) {
    return {
      ok: false,
      code: "gemini_not_configured",
      message: CMS_FALLBACK_REPLY,
    };
  }

  try {
    const cms = await fetchSiteChatCmsContext(db);
    const systemInstruction = buildSiteChatSystemInstruction(cms);
    const reply = await generateSiteChatReply({
      apiKey: options.geminiApiKey,
      model: options.geminiModel,
      systemInstruction,
      history: options.history,
      userMessage: options.message,
    });
    return { ok: true, reply, path: "cms" };
  } catch (err) {
    if (err instanceof GeminiSiteChatError) {
      return {
        ok: false,
        code: "gemini_error",
        message:
          err.code === "blocked"
            ? "Bu soruya yanıt veremiyorum. Lütfen haber, duyuru veya etkinliklerle ilgili sorunuzu yeniden ifade edin."
            : CMS_FALLBACK_REPLY,
      };
    }
    throw err;
  }
}
