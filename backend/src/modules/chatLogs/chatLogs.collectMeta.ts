import type { FastifyRequest } from "fastify";
import { getClientIp } from "../../lib/clientIp.js";

export type ChatRequestMeta = {
  ipAddress: string;
  userAgent: string | null;
  referer: string | null;
  acceptLanguage: string | null;
};

export function collectChatRequestMeta(req: FastifyRequest): ChatRequestMeta {
  const referer = req.headers.referer;
  const acceptLanguage = req.headers["accept-language"];

  return {
    ipAddress: getClientIp(req),
    userAgent:
      typeof req.headers["user-agent"] === "string"
        ? req.headers["user-agent"]
        : null,
    referer: typeof referer === "string" ? referer.slice(0, 2000) : null,
    acceptLanguage:
      typeof acceptLanguage === "string"
        ? acceptLanguage.slice(0, 200)
        : null,
  };
}
