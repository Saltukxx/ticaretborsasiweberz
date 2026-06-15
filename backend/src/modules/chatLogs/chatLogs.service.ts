import type { Database } from "../../db/connection.js";
import {
  chatConversationLogs,
  type ChatLogChannel,
  type ChatLogOutcome,
} from "../../db/schema/chatConversationLogs.js";
import type { ChatRequestMeta } from "./chatLogs.collectMeta.js";

export type InsertChatLogInput = {
  channel: ChatLogChannel;
  sessionId?: string | null;
  userMessage: string;
  botReply?: string | null;
  history?: unknown[];
  outcome: ChatLogOutcome;
  errorCode?: string | null;
  path?: string | null;
  context?: Record<string, unknown> | null;
  meta: ChatRequestMeta;
};

export async function insertChatLog(
  db: Database,
  input: InsertChatLogInput,
): Promise<void> {
  await db.insert(chatConversationLogs).values({
    channel: input.channel,
    sessionId: input.sessionId ?? null,
    userMessage: input.userMessage,
    botReply: input.botReply ?? null,
    history: input.history ?? [],
    outcome: input.outcome,
    errorCode: input.errorCode ?? null,
    path: input.path ?? null,
    context: input.context ?? null,
    ipAddress: input.meta.ipAddress,
    userAgent: input.meta.userAgent,
    referer: input.meta.referer,
    acceptLanguage: input.meta.acceptLanguage,
  });
}

/** Fire-and-forget; never blocks chat response. */
export function logChatConversation(
  db: Database,
  input: InsertChatLogInput,
  onError?: (err: unknown) => void,
): void {
  void insertChatLog(db, input).catch((err) => {
    onError?.(err);
  });
}
