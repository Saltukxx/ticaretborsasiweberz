import { ChatStreamError, consumeChatStream } from "./chatStream";
import { getBase } from "./recipeChatApiBase";
import type { RecipeVideoState } from "./recipeVideoControl";

export type RecipeChatHistoryTurn = {
  role: "user" | "model";
  text: string;
};

export type RecipeChatErrorCode =
  | "network"
  | "http"
  | "blocked"
  | "empty"
  | "not_configured"
  | "unknown";

export class RecipeChatApiError extends Error {
  constructor(
    message: string,
    public readonly code: RecipeChatErrorCode,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "RecipeChatApiError";
  }
}

function mapStatusToCode(status: number, apiCode?: string): RecipeChatErrorCode {
  if (status === 503 || apiCode === "GEMINI_NOT_CONFIGURED") return "not_configured";
  if (status === 422 || apiCode === "GEMINI_BLOCKED") return "blocked";
  if (apiCode === "GEMINI_NETWORK") return "network";
  if (apiCode === "GEMINI_EMPTY") return "empty";
  if (status >= 500 || status === 502) return "http";
  return "http";
}

async function postRecipeChatJson(
  message: string,
  history: RecipeChatHistoryTurn[],
  signal?: AbortSignal,
  currentStep?: number,
  videoState?: RecipeVideoState,
  sessionId?: string,
): Promise<string> {
  const url = `${getBase()}/api/v1/recipe-chat`;

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
        ...(currentStep !== undefined ? { currentStep } : {}),
        ...(videoState ? { videoState } : {}),
      }),
      signal,
    });
  } catch (e: unknown) {
    const isAbort = e instanceof Error && e.name === "AbortError";
    if (isAbort) throw e;
    throw new RecipeChatApiError("Bağlantı hatası", "network");
  }

  const json = (await res.json()) as
    | { data: { reply: string } }
    | { error: { code: string; message: string } };

  if (!res.ok || "error" in json) {
    const err = "error" in json ? json.error : { code: "UNKNOWN", message: res.statusText };
    throw new RecipeChatApiError(
      err.message,
      mapStatusToCode(res.status, err.code),
      res.status,
    );
  }

  const reply = json.data.reply?.trim();
  if (!reply) {
    throw new RecipeChatApiError("Boş yanıt", "empty", res.status);
  }

  return reply;
}

export async function postRecipeChatStream(
  message: string,
  history: RecipeChatHistoryTurn[],
  onDelta: (text: string) => void,
  signal?: AbortSignal,
  currentStep?: number,
  videoState?: RecipeVideoState,
  sessionId?: string,
): Promise<string> {
  const url = `${getBase()}/api/v1/recipe-chat?stream=1`;
  const done = await consumeChatStream(
    url,
    {
      message,
      history,
      ...(sessionId ? { sessionId } : {}),
      ...(currentStep !== undefined ? { currentStep } : {}),
      ...(videoState ? { videoState } : {}),
    },
    { onDelta },
    signal,
  );
  return done.reply.trim();
}

export async function postRecipeChat(
  message: string,
  history: RecipeChatHistoryTurn[],
  signal?: AbortSignal,
  currentStep?: number,
  videoState?: RecipeVideoState,
  sessionId?: string,
  onDelta?: (text: string) => void,
): Promise<string> {
  if (onDelta) {
    try {
      return await postRecipeChatStream(
        message,
        history,
        onDelta,
        signal,
        currentStep,
        videoState,
        sessionId,
      );
    } catch (err) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      if (isAbort) throw err;
      if (err instanceof ChatStreamError) {
        if (
          err.code === "STREAM_UNSUPPORTED" ||
          err.code === "network" ||
          err.code === "STREAM_INCOMPLETE"
        ) {
          return postRecipeChatJson(
            message,
            history,
            signal,
            currentStep,
            videoState,
            sessionId,
          );
        }
        throw new RecipeChatApiError(
          err.message,
          mapStatusToCode(502, err.code),
        );
      }
      if (err instanceof RecipeChatApiError) throw err;
      throw new RecipeChatApiError(
        err instanceof Error ? err.message : "Bağlantı hatası",
        "unknown",
      );
    }
  }

  try {
    return await postRecipeChatStream(
      message,
      history,
      () => {},
      signal,
      currentStep,
      videoState,
      sessionId,
    );
  } catch (err) {
    const isAbort = err instanceof Error && err.name === "AbortError";
    if (isAbort) throw err;
    if (err instanceof ChatStreamError) {
      if (
        err.code === "STREAM_UNSUPPORTED" ||
        err.code === "network" ||
        err.code === "STREAM_INCOMPLETE"
      ) {
        return postRecipeChatJson(
          message,
          history,
          signal,
          currentStep,
          videoState,
          sessionId,
        );
      }
      throw new RecipeChatApiError(err.message, mapStatusToCode(502, err.code));
    }
    throw err;
  }
}

/** Gemini bazen kaynak atıfı ekler; kullanıcıya gösterilmez. */
export function sanitizeRecipeReply(text: string): string {
  return text
    .replace(/\s*\([Bb]ilgi\s+kayna[ğg][ıi][^)]*\)\s*/g, "")
    .replace(/\s*\(CONTEXT[^)]*\)\s*/gi, "")
    .replace(/\s*\(kaynak:[^)]*\)\s*/gi, "")
    .trim();
}
