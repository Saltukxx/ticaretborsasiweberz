import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  hardDeleteEventAdmin,
  listEventsAdmin,
  publishEventAdmin,
  softDeleteEventAdmin,
  unpublishEventAdmin,
  type EventRow,
} from "@/api/eventsAdmin";
import { useAuth } from "@/auth/AuthContext";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EventsListPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [scope, setScope] = useState<"active" | "deleted" | "all">("active");
  const [q, setQ] = useState("");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });

  const listQ = useQuery({
    queryKey: ["events", "admin", scope, q, pagination.pageIndex, pagination.pageSize],
    queryFn: () =>
      listEventsAdmin({
        limit: pagination.pageSize,
        offset: pagination.pageIndex * pagination.pageSize,
        scope,
        q: q.trim() || undefined,
      }),
  });

  const rows = listQ.data?.data ?? [];
  const total = listQ.data?.meta.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pagination.pageSize));

  const publishM = useMutation({
    mutationFn: publishEventAdmin,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["events"] }),
  });
  const unpublishM = useMutation({
    mutationFn: unpublishEventAdmin,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["events"] }),
  });
  const softDelM = useMutation({
    mutationFn: softDeleteEventAdmin,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["events"] }),
  });
  const hardDelM = useMutation({
    mutationFn: hardDeleteEventAdmin,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["events"] }),
  });

  const columns = useMemo<ColumnDef<EventRow>[]>(
    () => [
      {
        id: "title",
        header: "Başlık",
        cell: ({ row }) => (
          <Link className="font-medium hover:underline" to={`/events/${row.original.id}/edit`}>
            {row.original.title}
          </Link>
        ),
      },
      {
        id: "startsAt",
        header: "Başlangıç",
        cell: ({ row }) =>
          new Date(row.original.startsAt).toLocaleString("tr-TR", {
            dateStyle: "short",
            timeStyle: "short",
          }),
      },
      {
        id: "status",
        header: "Durum",
        cell: ({ row }) => {
          const r = row.original;
          if (r.deletedAt) return <Badge variant="outline">silindi</Badge>;
          const isPast = new Date(r.startsAt).getTime() < Date.now();
          return (
            <div className="flex flex-wrap gap-1">
              {r.isPublished ? (
                <Badge className="bg-emerald-600">yayında</Badge>
              ) : (
                <Badge variant="secondary">taslak</Badge>
              )}
              {r.isPublished && isPast ? (
                <Badge variant="outline">geçmiş — sitede tamamlanan</Badge>
              ) : null}
              {r.registrationOpen ? <Badge variant="outline">kayıt açık</Badge> : null}
              {r.isStakeholder ? <Badge variant="outline">paydaş</Badge> : null}
              {r.statusLabel?.trim() ? (
                <Badge variant="outline">{r.statusLabel.trim()}</Badge>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="flex flex-wrap justify-end gap-1">
              {!r.deletedAt && (
                <>
                  {r.isPublished ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={unpublishM.isPending}
                      onClick={() => unpublishM.mutate(r.id)}
                    >
                      Yayından kaldır
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={publishM.isPending}
                      onClick={() => publishM.mutate(r.id)}
                    >
                      Yayınla
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-700"
                    disabled={softDelM.isPending}
                    onClick={() => {
                      if (confirm("Silinsin mi?")) softDelM.mutate(r.id);
                    }}
                  >
                    Sil
                  </Button>
                </>
              )}
              {user?.role === "super_admin" && r.deletedAt && (
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={hardDelM.isPending}
                  onClick={() => {
                    if (confirm("Kalıcı sil?")) hardDelM.mutate(r.id);
                  }}
                >
                  Kalıcı sil
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [publishM, unpublishM, softDelM, hardDelM, user?.role],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold">Etkinlikler</h1>
          <p className="text-sm text-zinc-600">Tarihli etkinlik yönetimi</p>
        </div>
        <Button asChild>
          <Link to="/events/new">Yeni etkinlik</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtreler</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="space-y-2">
            <Label>Kapsam</Label>
            <select
              className="h-10 rounded-md border px-3 text-sm"
              value={scope}
              onChange={(e) => {
                setScope(e.target.value as typeof scope);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
            >
              <option value="active">Aktif</option>
              <option value="deleted">Silinen</option>
              <option value="all">Tümü</option>
            </select>
          </div>
          <div className="max-w-md flex-1 space-y-2">
            <Label>Ara</Label>
            <Input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
            />
          </div>
        </CardContent>
      </Card>
      <DataTable
        columns={columns}
        data={rows}
        isLoading={listQ.isLoading}
        pagination={pagination}
        onPaginationChange={setPagination}
        pageCount={pageCount}
        total={total}
        rowId={(r) => r.id}
      />
    </div>
  );
}
