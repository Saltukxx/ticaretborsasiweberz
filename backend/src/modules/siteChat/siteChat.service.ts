import type { Database } from "../../db/connection.js";
import { getCached } from "../../lib/cache.js";
import {
  GeminiStreamError,
  streamGeminiGenerateContent,
} from "../../lib/geminiStream.js";
import {
  GeminiSiteChatError,
  generateSiteChatReply,
} from "../../lib/geminiSiteChat.js";
import {
  PRICES_CACHE_TTL_SEC,
  pricesBulletinCacheKey,
} from "../../lib/pricesCache.js";
import type { RedisClient } from "../../lib/redis.js";
import {
  SITE_CHAT_CMS_TTL_SEC,
  siteChatCmsCacheKey,
} from "../../lib/siteChatCache.js";
import { fetchBulletinPayload } from "../prices/prices.public.service.js";
import { fetchSiteChatCmsContext } from "./siteChat.cmsFetch.js";
import {
  CMS_FALLBACK_REPLY,
  buildSiteChatSystemInstruction,
} from "./siteChat.context.js";
import { buildPriceReply } from "./siteChat.priceHandler.js";
import {
  GREETING_REPLY,
  OFF_TOPIC_REPLY,
  OUT_OF_SCOPE_REPLY,
  THANKS_REPLY,
  classifySiteChatIntent,
} from "./siteChat.router.js";
import type { SiteChatHistoryTurn } from "./siteChat.schema.js";

export type SiteChatResult =
  | { ok: true; reply: string; path: "price" | "cms" | "static" }
  | { ok: false; code: "gemini_not_configured" | "gemini_error"; message: string };

export type SiteChatStreamEmitter = {
  delta: (text: string) => void;
};

type SiteChatOptions = {
  message: string;
  history: SiteChatHistoryTurn[];
  geminiApiKey?: string;
  geminiModel: string;
  maxOutputTokens?: number;
  signal?: AbortSignal;
};

async function loadBulletin(
  db: Database,
  redis: RedisClient | null,
  redisPrefix: string,
) {
  const key = pricesBulletinCacheKey(redisPrefix);
  return getCached(redis, key, PRICES_CACHE_TTL_SEC, () =>
    fetchBulletinPayload(db, redis, redisPrefix),
  );
}

async function loadCmsContext(db: Database, redis: RedisClient | null, redisPrefix: string) {
  const key = siteChatCmsCacheKey(redisPrefix);
  return getCached(redis, key, SITE_CHAT_CMS_TTL_SEC, () =>
    fetchSiteChatCmsContext(db),
  );
}


function resolveStaticIntent(
  message: string,
): { ok: true; reply: string; path: "static" } | null {
  const intent = classifySiteChatIntent(message);
  if (intent === "off_topic") {
    return { ok: true, reply: OFF_TOPIC_REPLY, path: "static" };
  }
  if (intent === "out_of_scope") {
    return { ok: true, reply: OUT_OF_SCOPE_REPLY, path: "static" };
  }
  if (intent === "greeting") {
    return { ok: true, reply: GREETING_REPLY, path: "static" };
  }
  if (intent === "thanks") {
    return { ok: true, reply: THANKS_REPLY, path: "static" };
  }
  return null;
}

async function generateCmsReply(
  db: Database,
  redis: RedisClient | null,
  redisPrefix: string,
  options: SiteChatOptions,
): Promise<SiteChatResult> {
  if (!options.geminiApiKey) {
    return {
      ok: false,
      code: "gemini_not_configured",
      message: CMS_FALLBACK_REPLY,
    };
  }

  try {
    const cms = await loadCmsContext(db, redis, redisPrefix);
    const systemInstruction = buildSiteChatSystemInstruction(cms);
    const reply = await generateSiteChatReply({
      apiKey: options.geminiApiKey,
      model: options.geminiModel,
      systemInstruction,
      history: options.history,
      userMessage: options.message,
      maxOutputTokens: options.maxOutputTokens,
      signal: options.signal,
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

export async function handleSiteChatMessage(
  db: Database,
  redis: RedisClient | null,
  redisPrefix: string,
  options: SiteChatOptions,
): Promise<SiteChatResult> {
  const staticReply = resolveStaticIntent(options.message);
  if (staticReply) return staticReply;

  const intent = classifySiteChatIntent(options.message);
  if (intent === "price") {
    const bulletin = await loadBulletin(db, redis, redisPrefix);
    const reply = buildPriceReply(
      options.message,
      bulletin.sessionDate,
      bulletin.rows,
    );
    return { ok: true, reply, path: "price" };
  }

  return generateCmsReply(db, redis, redisPrefix, options);
}

export async function streamSiteChatMessage(
  db: Database,
  redis: RedisClient | null,
  redisPrefix: string,
  options: SiteChatOptions,
  emit: SiteChatStreamEmitter,
): Promise<SiteChatResult> {
  const staticReply = resolveStaticIntent(options.message);
  if (staticReply) {
    emit.delta(staticReply.reply);
    return staticReply;
  }

  const intent = classifySiteChatIntent(options.message);
  if (intent === "price") {
    const bulletin = await loadBulletin(db, redis, redisPrefix);
    const reply = buildPriceReply(
      options.message,
      bulletin.sessionDate,
      bulletin.rows,
    );
    emit.delta(reply);
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
    const cms = await loadCmsContext(db, redis, redisPrefix);
    const systemInstruction = buildSiteChatSystemInstruction(cms);
    const contents = [
      ...options.history.map((turn) => ({
        role: turn.role,
        parts: [{ text: turn.text }],
      })),
      { role: "user", parts: [{ text: options.message }] },
    ];

    let full = "";
    for await (const delta of streamGeminiGenerateContent({
      apiKey: options.geminiApiKey,
      model: options.geminiModel,
      systemInstruction,
      contents,
      maxOutputTokens: options.maxOutputTokens,
      temperature: 0.4,
      signal: options.signal,
    })) {
      full += delta;
      emit.delta(delta);
    }

    return { ok: true, reply: full.trim(), path: "cms" };
  } catch (err) {
    if (err instanceof GeminiStreamError) {
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
