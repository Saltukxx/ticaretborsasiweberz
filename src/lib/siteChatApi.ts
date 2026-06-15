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

export async function postSiteChat(
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
