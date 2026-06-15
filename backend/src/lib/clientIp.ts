import type { FastifyRequest } from "fastify";

/** Client IP for rate limiting and audit. Uses Fastify `req.ip` (respects trustProxy). */
export function getClientIp(req: FastifyRequest): string {
  return req.ip;
}
