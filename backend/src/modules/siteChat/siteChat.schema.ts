import { z } from "zod";

const historyTurnSchema = z.object({
  role: z.enum(["user", "model"]),
  text: z.string().trim().min(1).max(4000),
});

export const siteChatBodySchema = z.object({
  message: z.string().trim().min(1).max(1000),
  history: z.array(historyTurnSchema).max(6).default([]),
  sessionId: z.string().uuid().optional(),
});

export type SiteChatHistoryTurn = z.infer<typeof historyTurnSchema>;
