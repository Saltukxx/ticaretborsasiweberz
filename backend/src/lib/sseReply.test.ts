import assert from "node:assert/strict";
import { test } from "node:test";
import type { FastifyReply } from "fastify";
import { endSseReply, endSseReplyOnAbort, initSseReply, isAbortError, writeSseEvent } from "./sseReply.js";

function mockReply(headersSent = false, writableEnded = false) {
  const writes: string[] = [];
  let ended = writableEnded;
  return {
    raw: {
      headersSent,
      get writableEnded() {
        return ended;
      },
      writeHead: () => {},
      write: (chunk: string) => {
        writes.push(chunk);
      },
      end: () => {
        ended = true;
      },
    },
    hijack: () => {},
    writes,
    get ended() {
      return ended;
    },
  };
}

test("initSseReply is idempotent when headers were already sent", () => {
  const reply = mockReply(true);
  let hijacked = 0;
  const fastifyReply = reply as unknown as FastifyReply & { hijack: () => void };
  fastifyReply.hijack = () => {
    hijacked += 1;
  };
  initSseReply(fastifyReply);
  assert.equal(hijacked, 0);
});

test("writeSseEvent and endSseReply no-op on closed streams", () => {
  const reply = mockReply(true, true);
  writeSseEvent(reply as unknown as FastifyReply, "delta", { text: "x" });
  endSseReply(reply as unknown as FastifyReply);
  assert.equal(reply.writes.length, 0);
  assert.equal(reply.ended, true);
});

test("isAbortError detects client disconnect aborts", () => {
  const abortErr = new Error("aborted");
  abortErr.name = "AbortError";
  assert.equal(isAbortError(abortErr), true);
  assert.equal(isAbortError(new Error("network")), false);
});

test("endSseReplyOnAbort closes hijacked streams only", () => {
  const open = mockReply(true, false);
  endSseReplyOnAbort(open as unknown as FastifyReply);
  assert.equal(open.ended, true);

  const closed = mockReply(false, false);
  endSseReplyOnAbort(closed as unknown as FastifyReply);
  assert.equal(closed.ended, false);
});
