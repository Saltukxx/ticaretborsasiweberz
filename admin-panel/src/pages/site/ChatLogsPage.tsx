import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import {
  chatLogChannelLabel,
  chatLogOutcomeLabel,
  exportChatLogsAdmin,
  getChatLogAdmin,
  listChatLogsAdmin,
  type ChatLogChannel,
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

function outcomeVariant(outcome: ChatLogOutcome) {
  if (outcome === "ok") return "default" as const;
  if (outcome === "blocked") return "secondary" as const;
  if (outcome === "validation_error") return "outline" as const;
  return "danger" as const;
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

  const rows = listQ.data?.data ?? [];
  const total = listQ.data?.meta.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pagination.pageSize));
  const detail = detailQ.data?.data;

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
          <button
            type="button"
            className="max-w-[220px] truncate text-left hover:underline"
            onClick={() => setSelectedId(row.original.id)}
            title={row.original.userMessagePreview}
          >
            {row.original.userMessagePreview}
          </button>
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
          <CardTitle className="text-base">Sohbet kayıtları (KVKK)</CardTitle>
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
            onPaginationChange={setPagination}
            isLoading={listQ.isLoading}
          />
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedId)} onOpenChange={(o) => !o && setSelectedId(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sohbet kaydı detayı</DialogTitle>
          </DialogHeader>
          {detailQ.isLoading && <p className="text-sm text-zinc-500">Yükleniyor…</p>}
          {detail && (
            <div className="space-y-4 text-sm">
              <div className="grid gap-2 sm:grid-cols-2">
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
                  {chatLogOutcomeLabel(detail.outcome as ChatLogOutcome)}
                </p>
                <p>
                  <span className="text-zinc-500">IP:</span>{" "}
                  <span className="font-mono">{detail.ipAddress ?? "—"}</span>
                </p>
                <p className="sm:col-span-2">
                  <span className="text-zinc-500">Oturum:</span>{" "}
                  <span className="font-mono text-xs break-all">
                    {detail.sessionId ?? "—"}
                  </span>
                </p>
              </div>
              <div>
                <Label>Kullanıcı sorusu</Label>
                <pre className="mt-1 whitespace-pre-wrap rounded bg-zinc-50 p-3 text-xs">
                  {detail.userMessage}
                </pre>
              </div>
              <div>
                <Label>Bot yanıtı</Label>
                <pre className="mt-1 whitespace-pre-wrap rounded bg-zinc-50 p-3 text-xs">
                  {detail.botReply ?? "—"}
                </pre>
              </div>
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
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
