import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";
import { useMemo, useState } from "react";
import {
  chatLogChannelLabel,
  chatLogOutcomeLabel,
  exportChatLogsAdmin,
  getChatLogAdmin,
  listChatLogsAdmin,
  listChatLogsBySessionAdmin,
  type ChatLogChannel,
  type ChatLogDetail,
  type ChatLogListItem,
  type ChatLogOutcome,
} from "@/api/chatLogsAdmin";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ChatTurn = { role: "user" | "model"; text: string };

function outcomeVariant(outcome: ChatLogOutcome) {
  if (outcome === "ok") return "default" as const;
  if (outcome === "blocked") return "secondary" as const;
  if (outcome === "validation_error") return "outline" as const;
  return "danger" as const;
}

function parseHistory(value: unknown): ChatTurn[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (
      item &&
      typeof item === "object" &&
      "role" in item &&
      "text" in item &&
      (item.role === "user" || item.role === "model") &&
      typeof item.text === "string"
    ) {
      return [{ role: item.role, text: item.text }];
    }
    return [];
  });
}

function ChatBubble({
  role,
  text,
  highlight,
}: {
  role: "user" | "model";
  text: string;
  highlight?: boolean;
}) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[92%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
          isUser
            ? highlight
              ? "bg-blue-100 text-blue-950 ring-2 ring-blue-300"
              : "bg-blue-50 text-blue-950"
            : highlight
              ? "bg-zinc-200 text-zinc-900 ring-2 ring-zinc-400"
              : "bg-zinc-100 text-zinc-900"
        }`}
      >
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
          {isUser ? "Kullanıcı" : "Asistan"}
        </p>
        {text}
      </div>
    </div>
  );
}

function ChatTranscript({ log, highlightCurrent }: { log: ChatLogDetail; highlightCurrent?: boolean }) {
  const prior = parseHistory(log.history);

  return (
    <div className="space-y-3">
      {prior.map((turn, i) => (
        <ChatBubble key={`h-${i}`} role={turn.role} text={turn.text} />
      ))}
      <ChatBubble
        role="user"
        text={log.userMessage}
        highlight={highlightCurrent}
      />
      {log.botReply ? (
        <ChatBubble role="model" text={log.botReply} highlight={highlightCurrent} />
      ) : (
        <p className="text-center text-xs text-zinc-500 italic">Yanıt üretilmedi</p>
      )}
    </div>
  );
}

function SessionTimeline({
  logs,
  activeId,
}: {
  logs: ChatLogDetail[];
  activeId: string;
}) {
  if (logs.length <= 1) {
    return <ChatTranscript log={logs[0]!} highlightCurrent />;
  }

  return (
    <div className="space-y-6">
      {logs.map((log, index) => (
        <div
          key={log.id}
          className={`rounded-lg border p-4 ${
            log.id === activeId ? "border-blue-300 bg-blue-50/40" : "border-zinc-200"
          }`}
        >
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-zinc-600">
            <span className="font-medium">Mesaj {index + 1}</span>
            <span>·</span>
            <span>{new Date(log.createdAt).toLocaleString("tr-TR")}</span>
            <Badge variant={outcomeVariant(log.outcome as ChatLogOutcome)} className="text-[10px]">
              {chatLogOutcomeLabel(log.outcome as ChatLogOutcome)}
            </Badge>
            {log.id === activeId && (
              <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-800">
                Seçili kayıt
              </span>
            )}
          </div>
          <ChatTranscript log={log} highlightCurrent={log.id === activeId} />
        </div>
      ))}
    </div>
  );
}

function JsonBlock({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return <span className="text-zinc-400 text-xs">—</span>;
  }
  return (
    <pre className="mt-1 max-h-48 overflow-auto rounded bg-zinc-50 p-2 text-[10px] text-zinc-700 whitespace-pre-wrap">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export function ChatLogsPage() {
  const [channel, setChannel] = useState<"" | ChatLogChannel>("");
  const [outcome, setOutcome] = useState<"" | ChatLogOutcome>("");
  const [ip, setIp] = useState("");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const listQ = useQuery({
    queryKey: [
      "chat-logs",
      channel,
      outcome,
      ip,
      q,
      from,
      to,
      pagination,
    ],
    queryFn: () =>
      listChatLogsAdmin({
        limit: pagination.pageSize,
        offset: pagination.pageIndex * pagination.pageSize,
        channel: channel || undefined,
        outcome: outcome || undefined,
        ip: ip.trim() || undefined,
        from: from.trim() || undefined,
        to: to.trim() || undefined,
        q: q.trim() || undefined,
      }),
  });

  const detailQ = useQuery({
    queryKey: ["chat-log", selectedId],
    queryFn: () => getChatLogAdmin(selectedId!),
    enabled: Boolean(selectedId),
  });

  const detail = detailQ.data?.data;
  const sessionId = detail?.sessionId ?? null;

  const sessionQ = useQuery({
    queryKey: ["chat-log-session", sessionId],
    queryFn: () => listChatLogsBySessionAdmin(sessionId!),
    enabled: Boolean(sessionId),
  });

  const rows = listQ.data?.data ?? [];
  const total = listQ.data?.meta.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pagination.pageSize));
  const sessionLogs = sessionQ.data?.data ?? (detail ? [detail] : []);

  const openDetail = (id: string) => setSelectedId(id);

  const columns = useMemo<ColumnDef<ChatLogListItem>[]>(
    () => [
      {
        id: "createdAt",
        header: "Tarih",
        cell: ({ row }) =>
          new Date(row.original.createdAt).toLocaleString("tr-TR"),
      },
      {
        id: "channel",
        header: "Kanal",
        cell: ({ row }) => chatLogChannelLabel(row.original.channel),
      },
      {
        id: "userMessagePreview",
        header: "Soru",
        cell: ({ row }) => (
          <span
            className="max-w-[220px] truncate block"
            title={row.original.userMessagePreview}
          >
            {row.original.userMessagePreview}
          </span>
        ),
      },
      {
        id: "botReplyPreview",
        header: "Yanıt",
        cell: ({ row }) => (
          <span className="max-w-[220px] truncate block" title={row.original.botReplyPreview}>
            {row.original.botReplyPreview || "—"}
          </span>
        ),
      },
      {
        id: "outcome",
        header: "Sonuç",
        cell: ({ row }) => (
          <Badge variant={outcomeVariant(row.original.outcome)}>
            {chatLogOutcomeLabel(row.original.outcome)}
          </Badge>
        ),
      },
      {
        id: "ipAddress",
        header: "IP",
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.ipAddress ?? "—"}</span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1"
            onClick={() => openDetail(row.original.id)}
          >
            <Eye className="h-3.5 w-3.5" />
            Detay
          </Button>
        ),
      },
    ],
    [],
  );

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportChatLogsAdmin({
        channel: channel || undefined,
        outcome: outcome || undefined,
        ip: ip.trim() || undefined,
        from: from.trim() || undefined,
        to: to.trim() || undefined,
        q: q.trim() || undefined,
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base">Sohbet kayıtları (KVKK)</CardTitle>
            <p className="mt-1 text-sm text-zinc-500">
              Kayıtları incelemek için satırdaki <strong>Detay</strong> düğmesine tıklayın.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={exporting}
            onClick={() => void handleExport()}
          >
            {exporting ? "İndiriliyor…" : "CSV dışa aktar"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <div>
              <Label htmlFor="chat-channel">Kanal</Label>
              <select
                id="chat-channel"
                className="mt-1 w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
                value={channel}
                onChange={(e) => {
                  setChannel(e.target.value as "" | ChatLogChannel);
                  setPagination((p) => ({ ...p, pageIndex: 0 }));
                }}
              >
                <option value="">Tümü</option>
                <option value="site_chat">Borsa Asistanı</option>
                <option value="recipe_chat">Kadayıf Sohbeti</option>
              </select>
            </div>
            <div>
              <Label htmlFor="chat-outcome">Sonuç</Label>
              <select
                id="chat-outcome"
                className="mt-1 w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
                value={outcome}
                onChange={(e) => {
                  setOutcome(e.target.value as "" | ChatLogOutcome);
                  setPagination((p) => ({ ...p, pageIndex: 0 }));
                }}
              >
                <option value="">Tümü</option>
                <option value="ok">Başarılı</option>
                <option value="error">Hata</option>
                <option value="blocked">Engellendi</option>
                <option value="validation_error">Doğrulama hatası</option>
              </select>
            </div>
            <div>
              <Label htmlFor="chat-ip">IP adresi</Label>
              <Input
                id="chat-ip"
                className="mt-1 font-mono text-sm"
                placeholder="5.180…"
                value={ip}
                onChange={(e) => {
                  setIp(e.target.value);
                  setPagination((p) => ({ ...p, pageIndex: 0 }));
                }}
              />
            </div>
            <div>
              <Label htmlFor="chat-q">Metin ara</Label>
              <Input
                id="chat-q"
                className="mt-1"
                placeholder="Soru / yanıt / oturum"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPagination((p) => ({ ...p, pageIndex: 0 }));
                }}
              />
            </div>
            <div>
              <Label htmlFor="chat-from">Başlangıç</Label>
              <Input
                id="chat-from"
                type="datetime-local"
                className="mt-1"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setPagination((p) => ({ ...p, pageIndex: 0 }));
                }}
              />
            </div>
            <div>
              <Label htmlFor="chat-to">Bitiş</Label>
              <Input
                id="chat-to"
                type="datetime-local"
                className="mt-1"
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  setPagination((p) => ({ ...p, pageIndex: 0 }));
                }}
              />
            </div>
          </div>

          <DataTable
            columns={columns}
            data={rows}
            pageCount={pageCount}
            pagination={pagination}
            total={total}
            onPaginationChange={setPagination}
            isLoading={listQ.isLoading}
          />
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedId)} onOpenChange={(o) => !o && setSelectedId(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sohbet kaydı detayı</DialogTitle>
          </DialogHeader>
          {detailQ.isLoading && <p className="text-sm text-zinc-500">Yükleniyor…</p>}
          {detail && (
            <Tabs defaultValue="conversation" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="conversation">Konuşma</TabsTrigger>
                <TabsTrigger value="meta">Teknik bilgi</TabsTrigger>
              </TabsList>

              <TabsContent value="conversation" className="space-y-4 pt-4">
                <div className="grid gap-2 rounded-lg border border-zinc-200 bg-zinc-50/80 p-3 text-sm sm:grid-cols-2">
                  <p>
                    <span className="text-zinc-500">Kanal:</span>{" "}
                    {chatLogChannelLabel(detail.channel as ChatLogChannel)}
                  </p>
                  <p>
                    <span className="text-zinc-500">Tarih:</span>{" "}
                    {new Date(detail.createdAt).toLocaleString("tr-TR")}
                  </p>
                  <p>
                    <span className="text-zinc-500">Sonuç:</span>{" "}
                    <Badge variant={outcomeVariant(detail.outcome as ChatLogOutcome)}>
                      {chatLogOutcomeLabel(detail.outcome as ChatLogOutcome)}
                    </Badge>
                  </p>
                  <p>
                    <span className="text-zinc-500">IP:</span>{" "}
                    <span className="font-mono">{detail.ipAddress ?? "—"}</span>
                  </p>
                  {detail.sessionId && (
                    <p className="sm:col-span-2">
                      <span className="text-zinc-500">Oturum:</span>{" "}
                      <span className="font-mono text-xs break-all">{detail.sessionId}</span>
                      {sessionLogs.length > 1 && (
                        <span className="ml-2 text-xs text-zinc-500">
                          ({sessionLogs.length} mesaj)
                        </span>
                      )}
                    </p>
                  )}
                </div>

                {sessionQ.isLoading && detail.sessionId && (
                  <p className="text-sm text-zinc-500">Oturum mesajları yükleniyor…</p>
                )}

                <SessionTimeline
                  logs={sessionLogs}
                  activeId={detail.id}
                />
              </TabsContent>

              <TabsContent value="meta" className="space-y-4 pt-4 text-sm">
                <div>
                  <Label>Gönderilen geçmiş (history)</Label>
                  <JsonBlock value={detail.history} />
                </div>
                {detail.context != null && (
                  <div>
                    <Label>Bağlam (context)</Label>
                    <JsonBlock value={detail.context} />
                  </div>
                )}
                <div className="grid gap-2 text-xs text-zinc-600">
                  <p>
                    <span className="font-medium">User-Agent:</span>{" "}
                    {detail.userAgent ?? "—"}
                  </p>
                  <p>
                    <span className="font-medium">Referer:</span>{" "}
                    {detail.referer ?? "—"}
                  </p>
                  <p>
                    <span className="font-medium">Accept-Language:</span>{" "}
                    {detail.acceptLanguage ?? "—"}
                  </p>
                  {detail.errorCode && (
                    <p>
                      <span className="font-medium">Hata kodu:</span> {detail.errorCode}
                    </p>
                  )}
                  {detail.path && (
                    <p>
                      <span className="font-medium">Yol (path):</span> {detail.path}
                    </p>
                  )}
                  <p>
                    <span className="font-medium">Kayıt ID:</span>{" "}
                    <span className="font-mono">{detail.id}</span>
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
