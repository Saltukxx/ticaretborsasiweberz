import type { SiteChatHistoryTurn } from "../modules/siteChat/siteChat.schema.js";
import {
  appendShortResponseHint,
  DEFAULT_GEMINI_MAX_OUTPUT_TOKENS,
} from "./geminiStream.js";

export type GeminiSiteChatErrorCode =
  | "network"
  | "http"
  | "blocked"
  | "empty"
  | "unknown";

export class GeminiSiteChatError extends Error {
  constructor(
    message: string,
    public readonly code: GeminiSiteChatErrorCode,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "GeminiSiteChatError";
  }
}

interface GenerateContentPart {
  text?: string;
}

interface GenerateContentMessage {
  role: string;
  parts: GenerateContentPart[];
}

interface GenerateContentCandidate {
  content?: { parts?: GenerateContentPart[] };
}

interface GenerateContentResponse {
  candidates?: GenerateContentCandidate[];
  promptFeedback?: { blockReason?: string };
  error?: { message?: string };
}

const DEFAULT_MODEL = "gemini-2.5-flash";

const SAFETY_SETTINGS = [
  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
] as const;

export async function generateSiteChatReply(options: {
  apiKey: string;
  model?: string;
  systemInstruction: string;
  history: SiteChatHistoryTurn[];
  userMessage: string;
  maxOutputTokens?: number;
  signal?: AbortSignal;
}): Promise<string> {
  const {
    apiKey,
    model = DEFAULT_MODEL,
    systemInstruction,
    history,
    userMessage,
    maxOutputTokens = DEFAULT_GEMINI_MAX_OUTPUT_TOKENS,
    signal,
  } = options;

  const contents: GenerateContentMessage[] = [
    ...history.map((turn) => ({
      role: turn.role,
      parts: [{ text: turn.text }],
    })),
    { role: "user", parts: [{ text: userMessage }] },
  ];

  const body = {
    systemInstruction: {
      parts: [{ text: appendShortResponseHint(systemInstruction) }],
    },
    contents,
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens,
      topP: 0.95,
      topK: 40,
    },
    safetySettings: SAFETY_SETTINGS,
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch (e: unknown) {
    const isAbort = e instanceof Error && e.name === "AbortError";
    if (isAbort) throw e;
    throw new GeminiSiteChatError("Bağlantı hatası", "network");
  }

  let data: GenerateContentResponse;
  try {
    data = (await res.json()) as GenerateContentResponse;
  } catch {
    throw new GeminiSiteChatError("Geçersiz API yanıtı", "http", res.status);
  }

  if (!res.ok) {
    const msg = data.error?.message ?? res.statusText ?? "Gemini API hatası";
    throw new GeminiSiteChatError(msg, "http", res.status);
  }

  if (data.promptFeedback?.blockReason) {
    throw new GeminiSiteChatError(
      `İstek engellendi: ${data.promptFeedback.blockReason}`,
      "blocked",
      res.status,
    );
  }

  const text =
    data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("")?.trim() ??
    "";

  if (!text) {
    throw new GeminiSiteChatError("Model yanıt döndürmedi", "empty", res.status);
  }

  return text;
}
