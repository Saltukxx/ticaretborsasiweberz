import { z } from "zod";

export const loginBodySchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(1024),
});

export const changePasswordBodySchema = z.object({
  currentPassword: z.string().min(1).max(1024),
  newPassword: z.string().min(12).max(1024),
});

export type LoginBody = z.infer<typeof loginBodySchema>;
export type ChangePasswordBody = z.infer<typeof changePasswordBodySchema>;
