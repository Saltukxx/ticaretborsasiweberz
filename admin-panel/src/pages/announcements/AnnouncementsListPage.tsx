import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  hardDeleteAnnouncementAdmin,
  listAnnouncementsAdmin,
  publishAnnouncementAdmin,
  softDeleteAnnouncementAdmin,
  unpublishAnnouncementAdmin,
  type AnnouncementRow,
} from "@/api/announcementsAdmin";
import { useAuth } from "@/auth/AuthContext";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAnnouncementStatus } from "@/lib/announcementStatus";

export function AnnouncementsListPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [scope, setScope] = useState<"active" | "deleted" | "all">("active");
  const [q, setQ] = useState("");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });

  const listQ = useQuery({
    queryKey: ["announcements", scope, q, pagination.pageIndex, pagination.pageSize],
    queryFn: () =>
      listAnnouncementsAdmin({
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
    mutationFn: publishAnnouncementAdmin,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["announcements"] }),
  });
  const unpublishM = useMutation({
    mutationFn: unpublishAnnouncementAdmin,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["announcements"] }),
  });
  const softDelM = useMutation({
    mutationFn: softDeleteAnnouncementAdmin,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["announcements"] }),
  });
  const hardDelM = useMutation({
    mutationFn: hardDeleteAnnouncementAdmin,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["announcements"] }),
  });

  const columns = useMemo<ColumnDef<AnnouncementRow>[]>(
    () => [
      {
        id: "title",
        header: "Başlık",
        cell: ({ row }) => (
          <Link className="font-medium hover:underline" to={`/announcements/${row.original.id}/edit`}>
            {row.original.title}
          </Link>
        ),
      },
      {
        id: "isTicker",
        header: "Ticker",
        cell: ({ row }) => (row.original.isTicker ? "evet" : "hayır"),
      },
      {
        id: "status",
        header: "Durum",
        cell: ({ row }) => {
          const status = getAnnouncementStatus(row.original);
          if (status.label === "silindi") return <Badge variant="outline">{status.label}</Badge>;
          if (status.label === "taslak") return <Badge variant="secondary">{status.label}</Badge>;
          return <Badge className={status.className}>{status.label}</Badge>;
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
                  {r.publishedAt ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={unpublishM.isPending}
                      onClick={() => unpublishM.mutate(r.id)}
                    >
                      Yayından kaldır
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={publishM.isPending}
                      onClick={() => publishM.mutate(r.id)}
                    >
                      Yayınla
                    </Button>
                  )}
                  <Button
                    type="button"
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
                  type="button"
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
    [user?.role, publishM, unpublishM, softDelM, hardDelM],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold">Duyurular</h1>
          <p className="text-sm text-zinc-600">Bülten ve ticker duyuruları</p>
        </div>
        <Button asChild>
          <Link to="/announcements/new">Yeni duyuru</Link>
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
              className="h-10 rounded-md border border-zinc-200 px-3 text-sm"
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
            <Label htmlFor="aq">Ara</Label>
            <Input
              id="aq"
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
