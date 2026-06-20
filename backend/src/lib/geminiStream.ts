const DEFAULT_MAX_OUTPUT_TOKENS = 512;

export const GEMINI_SHORT_RESPONSE_HINT =
  "Yanıtları mümkün olduğunca kısa tut (2–4 cümle veya kısa madde listesi).";

const SAFETY_SETTINGS = [
  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
] as const;

interface GenerateContentPart {
  text?: string;
}

interface GenerateContentMessage {
  role: string;
  parts: GenerateContentPart[];
}

interface StreamCandidate {
  content?: { parts?: GenerateContentPart[] };
}

interface StreamResponseChunk {
  candidates?: StreamCandidate[];
  promptFeedback?: { blockReason?: string };
  error?: { message?: string };
}

export type GeminiStreamErrorCode =
  | "network"
  | "http"
  | "blocked"
  | "empty"
  | "parse";

export class GeminiStreamError extends Error {
  constructor(
    message: string,
    public readonly code: GeminiStreamErrorCode,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "GeminiStreamError";
  }
}

export function appendShortResponseHint(systemInstruction: string): string {
  return `${systemInstruction.trim()}\n\n${GEMINI_SHORT_RESPONSE_HINT}`;
}

export function defaultGenerationConfig(
  maxOutputTokens = DEFAULT_MAX_OUTPUT_TOKENS,
  temperature = 0.4,
) {
  return {
    temperature,
    maxOutputTokens,
    topP: 0.95,
    topK: 40,
  };
}

export function buildStreamGenerateUrl(model: string, apiKey: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`;
}

export function extractTextFromStreamChunk(chunk: StreamResponseChunk): string {
  return (
    chunk.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? ""
  );
}

/** Parses Gemini SSE payload lines into incremental text deltas. */
export function* parseGeminiSseBuffer(buffer: string): Generator<string> {
  const lines = buffer.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) continue;
    const payload = trimmed.slice(5).trim();
    if (!payload || payload === "[DONE]") continue;
    let parsed: StreamResponseChunk;
    try {
      parsed = JSON.parse(payload) as StreamResponseChunk;
    } catch {
      continue;
    }
    if (parsed.promptFeedback?.blockReason) {
      throw new GeminiStreamError(
        `İstek engellendi: ${parsed.promptFeedback.blockReason}`,
        "blocked",
      );
    }
    if (parsed.error?.message) {
      throw new GeminiStreamError(parsed.error.message, "http");
    }
    const text = extractTextFromStreamChunk(parsed);
    if (text) yield text;
  }
}

export async function* streamGeminiGenerateContent(options: {
  apiKey: string;
  model: string;
  systemInstruction: string;
  contents: GenerateContentMessage[];
  maxOutputTokens?: number;
  temperature?: number;
  signal?: AbortSignal;
}): AsyncGenerator<string> {
  const {
    apiKey,
    model,
    systemInstruction,
    contents,
    maxOutputTokens = DEFAULT_MAX_OUTPUT_TOKENS,
    temperature = 0.4,
    signal,
  } = options;

  const body = {
    systemInstruction: {
      parts: [{ text: appendShortResponseHint(systemInstruction) }],
    },
    contents,
    generationConfig: defaultGenerationConfig(maxOutputTokens, temperature),
    safetySettings: SAFETY_SETTINGS,
  };

  let res: Response;
  try {
    res = await fetch(buildStreamGenerateUrl(model, apiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch (e: unknown) {
    const isAbort = e instanceof Error && e.name === "AbortError";
    if (isAbort) throw e;
    throw new GeminiStreamError("Bağlantı hatası", "network");
  }

  if (!res.ok) {
    let msg = res.statusText || "Gemini API hatası";
    try {
      const errBody = (await res.json()) as { error?: { message?: string } };
      msg = errBody.error?.message ?? msg;
    } catch {
      /* ignore */
    }
    throw new GeminiStreamError(msg, "http", res.status);
  }

  if (!res.body) {
    throw new GeminiStreamError("Akış gövdesi yok", "empty", res.status);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let carry = "";
  let total = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      carry += decoder.decode(value, { stream: true });
      const parts = carry.split("\n\n");
      carry = parts.pop() ?? "";
      for (const block of parts) {
        for (const delta of parseGeminiSseBuffer(block)) {
          total += delta;
          yield delta;
        }
      }
    }
    if (carry.trim()) {
      for (const delta of parseGeminiSseBuffer(carry)) {
        total += delta;
        yield delta;
      }
    }
  } finally {
    reader.releaseLock();
  }

  if (!total.trim()) {
    throw new GeminiStreamError("Model yanıt döndürmedi", "empty");
  }
}

export { DEFAULT_MAX_OUTPUT_TOKENS as DEFAULT_GEMINI_MAX_OUTPUT_TOKENS };
