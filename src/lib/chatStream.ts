export type ChatStreamDonePayload = {
  reply: string;
  path?: string;
};

export type ChatStreamErrorPayload = {
  code?: string;
  message: string;
};

export type ChatStreamHandlers = {
  onDelta?: (text: string) => void;
  onDone?: (data: ChatStreamDonePayload) => void;
  onError?: (data: ChatStreamErrorPayload) => void;
};

export class ChatStreamError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly status?: number,
    public readonly fallback = true,
  ) {
    super(message);
    this.name = "ChatStreamError";
  }
}

function parseSseBlock(
  block: string,
  handlers: ChatStreamHandlers,
): ChatStreamDonePayload | null {
  let eventName = "message";
  let dataLine = "";

  for (const line of block.split("\n")) {
    if (line.startsWith("event:")) {
      eventName = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLine += line.slice(5).trim();
    }
  }

  if (!dataLine) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(dataLine);
  } catch {
    return null;
  }

  if (eventName === "delta") {
    const text = (parsed as { text?: string }).text;
    if (text) handlers.onDelta?.(text);
    return null;
  }

  if (eventName === "done") {
    const payload = parsed as ChatStreamDonePayload;
    handlers.onDone?.(payload);
    return payload;
  }

  if (eventName === "error") {
    const err = parsed as ChatStreamErrorPayload;
    handlers.onError?.(err);
    throw new ChatStreamError(err.message || "Akış hatası", err.code, undefined, false);
  }

  return null;
}

export async function consumeChatStream(
  url: string,
  body: unknown,
  handlers: ChatStreamHandlers,
  signal?: AbortSignal,
): Promise<ChatStreamDonePayload> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "text/event-stream",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal,
    });
  } catch (e: unknown) {
    const isAbort = e instanceof Error && e.name === "AbortError";
    if (isAbort) throw e;
    throw new ChatStreamError("Bağlantı hatası", "network");
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (!res.ok || !contentType.includes("text/event-stream") || !res.body) {
    throw new ChatStreamError(
      "Akış desteklenmiyor",
      "STREAM_UNSUPPORTED",
      res.status,
    );
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let carry = "";
  let donePayload: ChatStreamDonePayload | null = null;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      carry += decoder.decode(value, { stream: true });
      const parts = carry.split("\n\n");
      carry = parts.pop() ?? "";
      for (const block of parts) {
        const result = parseSseBlock(block, handlers);
        if (result) donePayload = result;
      }
    }
    if (carry.trim()) {
      const result = parseSseBlock(carry, handlers);
      if (result) donePayload = result;
    }
  } finally {
    reader.releaseLock();
  }

  if (!donePayload?.reply?.trim()) {
    throw new ChatStreamError("Akış tamamlanmadı", "STREAM_INCOMPLETE");
  }

  return donePayload;
}
