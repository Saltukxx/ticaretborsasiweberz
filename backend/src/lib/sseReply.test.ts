import assert from "node:assert/strict";
import test from "node:test";
import { initSseReply, writeSseEvent } from "./sseReply.js";

test("initSseReply is idempotent when headers are already sent", () => {
  let writeHeadCalls = 0;
  let hijackCalls = 0;
  const writes: string[] = [];

  const raw = {
    headersSent: false,
    writeHead(status: number, headers: Record<string, string>) {
      writeHeadCalls += 1;
      this.headersSent = true;
      assert.equal(status, 200);
      assert.equal(headers["Content-Type"], "text/event-stream; charset=utf-8");
    },
    write(chunk: string) {
      writes.push(chunk);
    },
    end() {},
  };

  const reply = {
    raw,
    hijack() {
      hijackCalls += 1;
    },
  };

  initSseReply(reply as never);
  initSseReply(reply as never);

  assert.equal(hijackCalls, 1);
  assert.equal(writeHeadCalls, 1);

  writeSseEvent(reply as never, "error", { code: "GEMINI_BLOCKED", message: "blocked" });
  assert.match(writes[0] ?? "", /event: error/);
});
