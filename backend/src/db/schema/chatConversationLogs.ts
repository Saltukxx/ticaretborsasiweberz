import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const CHAT_LOG_CHANNELS = ["site_chat", "recipe_chat"] as const;
export type ChatLogChannel = (typeof CHAT_LOG_CHANNELS)[number];

export const CHAT_LOG_OUTCOMES = [
  "ok",
  "error",
  "blocked",
  "validation_error",
] as const;
export type ChatLogOutcome = (typeof CHAT_LOG_OUTCOMES)[number];

export const chatConversationLogs = pgTable(
  "chat_conversation_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    channel: varchar("channel", { length: 32 }).notNull(),
    sessionId: varchar("session_id", { length: 64 }),
    userMessage: text("user_message").notNull(),
    botReply: text("bot_reply"),
    history: jsonb("history").notNull().default([]),
    outcome: varchar("outcome", { length: 32 }).notNull(),
    errorCode: varchar("error_code", { length: 50 }),
    path: varchar("path", { length: 20 }),
    context: jsonb("context"),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    referer: varchar("referer", { length: 2000 }),
    acceptLanguage: varchar("accept_language", { length: 200 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("idx_chat_logs_channel_created").on(t.channel, t.createdAt),
    index("idx_chat_logs_session_created").on(t.sessionId, t.createdAt),
    index("idx_chat_logs_outcome_created").on(t.outcome, t.createdAt),
    index("idx_chat_logs_ip_created").on(t.ipAddress, t.createdAt),
  ],
);
