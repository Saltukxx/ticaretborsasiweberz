import { z } from "zod";

const historyTurnSchema = z.object({
  role: z.enum(["user", "model"]),
  text: z.string().min(1).max(4000),
});

export const recipeChatBodySchema = z.object({
  message: z.string().trim().min(1).max(2000),
  history: z.array(historyTurnSchema).max(8).default([]),
  sessionId: z.string().uuid().optional(),
  /** 0 = not started; 1–7 = active recipe step */
  currentStep: z.number().int().min(0).max(7).optional(),
  videoState: z
    .object({
      currentStep: z.number().int().min(0).max(7),
      currentTime: z.number().min(0),
      duration: z.number().min(0),
      isPlaying: z.boolean(),
      awaitingContinue: z.boolean(),
    })
    .optional(),
});

export type RecipeChatBody = z.infer<typeof recipeChatBodySchema>;
