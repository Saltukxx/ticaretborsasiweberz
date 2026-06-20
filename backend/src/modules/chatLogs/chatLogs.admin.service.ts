import {
  and,
  count,
  desc,
  eq,
  gte,
  ilike,
  lte,
  or,
  type SQL,
} from "drizzle-orm";
import type { Database } from "../../db/connection.js";
import { chatConversationLogs } from "../../db/schema/index.js";
import type { ChatLogListQuery } from "./chatLogs.admin.schema.js";

function escapeLike(s: string): string {
  return s.replace(/[%_\\]/g, "\\$&");
}

function buildWhereClause(p: ChatLogListQuery): SQL | undefined {
  const parts: SQL[] = [];

  if (p.channel) parts.push(eq(chatConversationLogs.channel, p.channel));
  if (p.outcome) parts.push(eq(chatConversationLogs.outcome, p.outcome));
  if (p.path) parts.push(eq(chatConversationLogs.path, p.path));

  if (p.ip?.trim()) {
    const like = `%${escapeLike(p.ip.trim())}%`;
    parts.push(ilike(chatConversationLogs.ipAddress, like));
  }

  if (p.from) {
    const d = new Date(p.from);
    if (!Number.isNaN(d.getTime())) parts.push(gte(chatConversationLogs.createdAt, d));
  }
  if (p.to) {
    const d = new Date(p.to);
    if (!Number.isNaN(d.getTime())) parts.push(lte(chatConversationLogs.createdAt, d));
  }

  const term = p.q?.trim();
  if (term) {
    const like = `%${escapeLike(term)}%`;
    parts.push(
      or(
        ilike(chatConversationLogs.userMessage, like),
        ilike(chatConversationLogs.botReply, like),
        ilike(chatConversationLogs.sessionId, like),
      ) as SQL,
    );
  }

  if (parts.length === 0) return undefined;
  if (parts.length === 1) return parts[0];
  return and(...parts);
}

export async function listChatLogsAdmin(
  db: Database,
  p: ChatLogListQuery,
) {
  const whereClause = buildWhereClause(p);

  const countBase = db.select({ total: count() }).from(chatConversationLogs);
  const [countRow] = await (whereClause
    ? countBase.where(whereClause)
    : countBase);

  const rowsBase = db.select().from(chatConversationLogs);
  const rows = await (whereClause ? rowsBase.where(whereClause) : rowsBase)
    .orderBy(desc(chatConversationLogs.createdAt))
    .limit(p.limit)
    .offset(p.offset);

  return { rows, total: Number(countRow?.total ?? 0) };
}

export async function getChatLogByIdAdmin(db: Database, id: string) {
  const [row] = await db
    .select()
    .from(chatConversationLogs)
    .where(eq(chatConversationLogs.id, id))
    .limit(1);
  return row ?? null;
}

export async function listChatLogsBySessionAdmin(
  db: Database,
  sessionId: string,
) {
  return db
    .select()
    .from(chatConversationLogs)
    .where(eq(chatConversationLogs.sessionId, sessionId))
    .orderBy(chatConversationLogs.createdAt);
}

export async function listChatLogsForExport(
  db: Database,
  p: Omit<ChatLogListQuery, "limit" | "offset">,
) {
  const whereClause = buildWhereClause({ ...p, limit: 100, offset: 0 });
  const base = db.select().from(chatConversationLogs);
  return (whereClause ? base.where(whereClause) : base).orderBy(
    desc(chatConversationLogs.createdAt),
  );
}

export function summarizeMessage(text: string | null, max = 80): string {
  if (!text) return "";
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/** Map row for list API (shorter payloads). */
export function toChatLogListItem(row: typeof chatConversationLogs.$inferSelect) {
  return {
    id: row.id,
    channel: row.channel,
    sessionId: row.sessionId,
    userMessagePreview: summarizeMessage(row.userMessage),
    botReplyPreview: summarizeMessage(row.botReply),
    outcome: row.outcome,
    path: row.path,
    ipAddress: row.ipAddress,
    createdAt: row.createdAt,
  };
}

export function chatLogToCsvRow(
  row: typeof chatConversationLogs.$inferSelect,
): string[] {
  return [
    row.id,
    row.channel,
    row.sessionId ?? "",
    row.userMessage.replace(/\r?\n/g, " "),
    (row.botReply ?? "").replace(/\r?\n/g, " "),
    row.outcome,
    row.errorCode ?? "",
    row.path ?? "",
    row.ipAddress ?? "",
    (row.userAgent ?? "").replace(/\r?\n/g, " "),
    row.referer ?? "",
    row.createdAt.toISOString(),
  ];
}

export const CHAT_LOG_CSV_HEADERS = [
  "id",
  "channel",
  "session_id",
  "user_message",
  "bot_reply",
  "outcome",
  "error_code",
  "path",
  "ip_address",
  "user_agent",
  "referer",
  "created_at",
];
