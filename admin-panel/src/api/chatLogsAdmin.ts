import { getAccessToken } from "@/auth/token";
import { apiRequest, getBase, type ApiEnvelope } from "./http";

export type ChatLogChannel = "site_chat" | "recipe_chat";
export type ChatLogOutcome = "ok" | "error" | "blocked" | "validation_error";

export type ChatLogListItem = {
  id: string;
  channel: ChatLogChannel;
  sessionId: string | null;
  userMessagePreview: string;
  botReplyPreview: string;
  outcome: ChatLogOutcome;
  path: string | null;
  ipAddress: string | null;
  createdAt: string;
};

export type ChatLogDetail = {
  id: string;
  channel: string;
  sessionId: string | null;
  userMessage: string;
  botReply: string | null;
  history: unknown;
  outcome: string;
  errorCode: string | null;
  path: string | null;
  context: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  referer: string | null;
  acceptLanguage: string | null;
  createdAt: string;
};

export async function listChatLogsAdmin(params: {
  limit: number;
  offset: number;
  channel?: ChatLogChannel;
  outcome?: ChatLogOutcome;
  path?: string;
  ip?: string;
  from?: string;
  to?: string;
  q?: string;
}) {
  const q = new URLSearchParams();
  q.set("limit", String(params.limit));
  q.set("offset", String(params.offset));
  if (params.channel) q.set("channel", params.channel);
  if (params.outcome) q.set("outcome", params.outcome);
  if (params.path) q.set("path", params.path);
  if (params.ip) q.set("ip", params.ip);
  if (params.from) q.set("from", params.from);
  if (params.to) q.set("to", params.to);
  if (params.q) q.set("q", params.q);
  return apiRequest<{ data: ChatLogListItem[]; meta: { total: number } }>(
    `/api/v1/admin/chat-logs?${q}`,
  );
}

export async function getChatLogAdmin(id: string) {
  return apiRequest<ApiEnvelope<ChatLogDetail>>(`/api/v1/admin/chat-logs/${id}`);
}

export async function listChatLogsBySessionAdmin(sessionId: string) {
  return apiRequest<ApiEnvelope<ChatLogDetail[]>>(
    `/api/v1/admin/chat-logs/session/${encodeURIComponent(sessionId)}`,
  );
}

export async function exportChatLogsAdmin(params: {
  channel?: ChatLogChannel;
  outcome?: ChatLogOutcome;
  path?: string;
  ip?: string;
  from?: string;
  to?: string;
  q?: string;
}) {
  const q = new URLSearchParams();
  if (params.channel) q.set("channel", params.channel);
  if (params.outcome) q.set("outcome", params.outcome);
  if (params.path) q.set("path", params.path);
  if (params.ip) q.set("ip", params.ip);
  if (params.from) q.set("from", params.from);
  if (params.to) q.set("to", params.to);
  if (params.q) q.set("q", params.q);

  const token = getAccessToken();
  const res = await fetch(`${getBase()}/api/v1/admin/chat-logs/export?${q}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("CSV dışa aktarılamadı");
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "chat-logs.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

const CHANNEL_LABELS: Record<ChatLogChannel, string> = {
  site_chat: "Borsa Asistanı",
  recipe_chat: "Kadayıf Sohbeti",
};

const OUTCOME_LABELS: Record<ChatLogOutcome, string> = {
  ok: "Başarılı",
  error: "Hata",
  blocked: "Engellendi",
  validation_error: "Doğrulama hatası",
};

export function chatLogChannelLabel(channel: ChatLogChannel): string {
  return CHANNEL_LABELS[channel] ?? channel;
}

export function chatLogOutcomeLabel(outcome: ChatLogOutcome): string {
  return OUTCOME_LABELS[outcome] ?? outcome;
}
