import { buildGeminiRecipeFullSystemInstruction } from "../modules/recipeChat/recipeChat.context.js";
import type { RecipeVideoStateInput } from "../modules/recipeChat/recipeChat.context.js";
import {
  appendShortResponseHint,
  DEFAULT_GEMINI_MAX_OUTPUT_TOKENS,
  GeminiStreamError,
  streamGeminiGenerateContent,
} from "./geminiStream.js";

export type GeminiRecipeErrorCode =
  | "network"
  | "http"
  | "blocked"
  | "empty"
  | "unknown";

export class GeminiRecipeError extends Error {
  constructor(
    message: string,
    public readonly code: GeminiRecipeErrorCode,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "GeminiRecipeError";
  }
}

export interface GeminiRecipeChatHistoryTurn {
  role: "user" | "model";
  text: string;
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

function buildRecipeContents(
  history: GeminiRecipeChatHistoryTurn[],
  userMessage: string,
): GenerateContentMessage[] {
  return [
    ...history.map((turn) => ({
      role: turn.role,
      parts: [{ text: turn.text }],
    })),
    {
      role: "user",
      parts: [{ text: userMessage }],
    },
  ];
}

function buildRecipeSystemInstruction(
  currentStep?: number,
  videoState?: RecipeVideoStateInput,
): string {
  return appendShortResponseHint(
    buildGeminiRecipeFullSystemInstruction(currentStep, videoState),
  );
}

function mapStreamError(err: GeminiStreamError): GeminiRecipeError {
  const code =
    err.code === "network"
      ? "network"
      : err.code === "blocked"
        ? "blocked"
        : err.code === "empty"
          ? "empty"
          : "http";
  return new GeminiRecipeError(err.message, code, err.status);
}

export async function generateRecipeChatReply(options: {
  apiKey: string;
  model?: string;
  history: GeminiRecipeChatHistoryTurn[];
  userMessage: string;
  currentStep?: number;
  videoState?: RecipeVideoStateInput;
  maxOutputTokens?: number;
  signal?: AbortSignal;
}): Promise<string> {
  const {
    apiKey,
    model = DEFAULT_MODEL,
    history,
    userMessage,
    currentStep,
    videoState,
    maxOutputTokens = DEFAULT_GEMINI_MAX_OUTPUT_TOKENS,
    signal,
  } = options;

  const body = {
    systemInstruction: {
      parts: [
        {
          text: buildRecipeSystemInstruction(currentStep, videoState),
        },
      ],
    },
    contents: buildRecipeContents(history, userMessage),
    generationConfig: {
      temperature: 0.5,
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
    const msg = e instanceof Error ? e.message : String(e);
    if (
      msg.includes("Failed to fetch") ||
      msg.includes("NetworkError") ||
      e instanceof TypeError
    ) {
      throw new GeminiRecipeError("Bağlantı hatası", "network");
    }
    throw new GeminiRecipeError(msg || "Bağlantı hatası", "unknown");
  }

  let data: GenerateContentResponse;
  try {
    data = (await res.json()) as GenerateContentResponse;
  } catch {
    throw new GeminiRecipeError("Geçersiz API yanıtı", "http", res.status);
  }

  if (!res.ok) {
    const msg = data.error?.message ?? res.statusText ?? "Gemini API hatası";
    throw new GeminiRecipeError(msg, "http", res.status);
  }

  if (data.promptFeedback?.blockReason) {
    throw new GeminiRecipeError(
      `İstek engellendi: ${data.promptFeedback.blockReason}`,
      "blocked",
      res.status,
    );
  }

  const text =
    data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("")?.trim() ??
    "";

  if (!text) {
    throw new GeminiRecipeError("Model yanıt döndürmedi", "empty", res.status);
  }

  return text;
}

export async function streamRecipeChatReply(options: {
  apiKey: string;
  model?: string;
  history: GeminiRecipeChatHistoryTurn[];
  userMessage: string;
  currentStep?: number;
  videoState?: RecipeVideoStateInput;
  maxOutputTokens?: number;
  signal?: AbortSignal;
  onDelta: (text: string) => void;
}): Promise<string> {
  const {
    apiKey,
    model = DEFAULT_MODEL,
    history,
    userMessage,
    currentStep,
    videoState,
    maxOutputTokens = DEFAULT_GEMINI_MAX_OUTPUT_TOKENS,
    signal,
    onDelta,
  } = options;

  try {
    let full = "";
    for await (const delta of streamGeminiGenerateContent({
      apiKey,
      model,
      systemInstruction: buildGeminiRecipeFullSystemInstruction(
        currentStep,
        videoState,
      ),
      contents: buildRecipeContents(history, userMessage),
      maxOutputTokens,
      temperature: 0.5,
      signal,
    })) {
      full += delta;
      onDelta(delta);
    }
    return full.trim();
  } catch (err) {
    if (err instanceof GeminiStreamError) {
      throw mapStreamError(err);
    }
    throw err;
  }
}

export { DEFAULT_MODEL as DEFAULT_GEMINI_RECIPE_MODEL };
