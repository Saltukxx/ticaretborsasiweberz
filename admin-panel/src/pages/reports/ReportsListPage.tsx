import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  hardDeleteReportAdmin,
  listReportsAdmin,
  publishReportAdmin,
  softDeleteReportAdmin,
  unpublishReportAdmin,
  type ReportRow,
} from "@/api/reportsAdmin";
import { useAuth } from "@/auth/AuthContext";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ReportsListPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [scope, setScope] = useState<"active" | "deleted" | "all">("active");
  const [q, setQ] = useState("");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });

  const listQ = useQuery({
    queryKey: ["reports", scope, q, pagination.pageIndex, pagination.pageSize],
    queryFn: () =>
      listReportsAdmin({
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
    mutationFn: publishReportAdmin,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["reports"] }),
  });
  const unpublishM = useMutation({
    mutationFn: unpublishReportAdmin,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["reports"] }),
  });
  const softDelM = useMutation({
    mutationFn: softDeleteReportAdmin,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["reports"] }),
  });
  const hardDelM = useMutation({
    mutationFn: hardDeleteReportAdmin,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["reports"] }),
  });

  const columns = useMemo<ColumnDef<ReportRow>[]>(
    () => [
      {
        id: "name",
        header: "Ad",
        cell: ({ row }) => (
          <Link className="font-medium hover:underline" to={`/reports/${row.original.id}/edit`}>
            {row.original.name}
          </Link>
        ),
      },
      { header: "Tür", accessorKey: "type" },
      {
        id: "status",
        header: "Durum",
        cell: ({ row }) => {
          const r = row.original;
          if (r.deletedAt) return <Badge variant="outline">silindi</Badge>;
          if (r.isPublished) return <Badge className="bg-emerald-600">yayında</Badge>;
          return <Badge variant="secondary">taslak</Badge>;
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
          <h1 className="text-2xl font-semibold">Raporlar</h1>
          <p className="text-sm text-zinc-600">PDF raporları</p>
        </div>
        <Button asChild>
          <Link to="/reports/new">Yeni rapor</Link>
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
