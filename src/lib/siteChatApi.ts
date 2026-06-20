import { ChatStreamError, consumeChatStream } from "./chatStream";
import { getBase } from "./recipeChatApiBase";

export type SiteChatHistoryTurn = {
  role: "user" | "model";
  text: string;
};

export type SiteChatPath = "price" | "cms" | "static";

export class SiteChatApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "SiteChatApiError";
  }
}

async function postSiteChatJson(
  message: string,
  history: SiteChatHistoryTurn[],
  signal?: AbortSignal,
  sessionId?: string,
): Promise<{ reply: string; path: SiteChatPath }> {
  const url = `${getBase()}/api/v1/site-chat`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        history,
        ...(sessionId ? { sessionId } : {}),
      }),
      signal,
    });
  } catch (e: unknown) {
    const isAbort = e instanceof Error && e.name === "AbortError";
    if (isAbort) throw e;
    throw new SiteChatApiError("Bağlantı hatası");
  }

  const json = (await res.json()) as
    | { data: { reply: string; path: SiteChatPath } }
    | { error: { code: string; message: string } };

  if (!res.ok || "error" in json) {
    const err = "error" in json ? json.error : { message: res.statusText };
    throw new SiteChatApiError(err.message, res.status);
  }

  const reply = json.data.reply?.trim();
  if (!reply) throw new SiteChatApiError("Boş yanıt", res.status);
  return { reply, path: json.data.path };
}

export async function postSiteChatStream(
  message: string,
  history: SiteChatHistoryTurn[],
  onDelta: (text: string) => void,
  signal?: AbortSignal,
  sessionId?: string,
): Promise<{ reply: string; path: SiteChatPath }> {
  const url = `${getBase()}/api/v1/site-chat?stream=1`;
  const done = await consumeChatStream(
    url,
    {
      message,
      history,
      ...(sessionId ? { sessionId } : {}),
    },
    { onDelta },
    signal,
  );
  return {
    reply: done.reply.trim(),
    path: (done.path as SiteChatPath | undefined) ?? "cms",
  };
}

export async function postSiteChat(
  message: string,
  history: SiteChatHistoryTurn[],
  signal?: AbortSignal,
  sessionId?: string,
  onDelta?: (text: string) => void,
): Promise<{ reply: string; path: SiteChatPath }> {
  if (onDelta) {
    try {
      return await postSiteChatStream(message, history, onDelta, signal, sessionId);
    } catch (err) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      if (isAbort) throw err;
      if (err instanceof ChatStreamError) {
        if (
          err.code === "STREAM_UNSUPPORTED" ||
          err.code === "network" ||
          err.code === "STREAM_INCOMPLETE"
        ) {
          return postSiteChatJson(message, history, signal, sessionId);
        }
        throw new SiteChatApiError(err.message);
      }
      if (err instanceof SiteChatApiError) throw err;
      throw new SiteChatApiError(
        err instanceof Error ? err.message : "Bağlantı hatası",
      );
    }
  }

  try {
    return await postSiteChatStream(message, history, () => {}, signal, sessionId);
  } catch (err) {
    const isAbort = err instanceof Error && err.name === "AbortError";
    if (isAbort) throw err;
    if (err instanceof ChatStreamError) {
      if (
        err.code === "STREAM_UNSUPPORTED" ||
        err.code === "network" ||
        err.code === "STREAM_INCOMPLETE"
      ) {
        return postSiteChatJson(message, history, signal, sessionId);
      }
      throw new SiteChatApiError(err.message);
    }
    throw err;
  }
}
