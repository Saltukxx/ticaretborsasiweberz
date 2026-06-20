import { z } from "zod";
import { CHAT_LOG_CHANNELS, CHAT_LOG_OUTCOMES } from "../../db/schema/chatConversationLogs.js";

export const chatLogListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  channel: z.enum(CHAT_LOG_CHANNELS).optional(),
  outcome: z.enum(CHAT_LOG_OUTCOMES).optional(),
  path: z.string().max(20).optional(),
  ip: z.string().max(45).optional(),
  from: z.string().max(40).optional(),
  to: z.string().max(40).optional(),
  q: z.string().max(200).optional(),
});

export const chatLogIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const chatLogSessionParamsSchema = z.object({
  sessionId: z.string().min(1).max(64),
});

export type ChatLogListQuery = z.infer<typeof chatLogListQuerySchema>;
