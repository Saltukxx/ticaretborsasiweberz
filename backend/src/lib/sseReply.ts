import type { FastifyReply } from "fastify";

export function initSseReply(reply: FastifyReply): void {
  if (reply.raw.headersSent) return;
  reply.hijack();
  reply.raw.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
}

export function writeSseEvent(
  reply: FastifyReply,
  event: string,
  data: unknown,
): void {
  if (reply.raw.writableEnded) return;
  reply.raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export function endSseReply(reply: FastifyReply): void {
  if (reply.raw.writableEnded) return;
  reply.raw.end();
}
