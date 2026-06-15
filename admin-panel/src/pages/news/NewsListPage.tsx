import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  hardDeleteNewsAdmin,
  listNewsAdmin,
  publishNewsAdmin,
  softDeleteNewsAdmin,
  unpublishNewsAdmin,
  type NewsRow,
} from "@/api/newsAdmin";
import { useAuth } from "@/auth/AuthContext";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NewsListPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [scope, setScope] = useState<"active" | "deleted" | "all">("active");
  const [q, setQ] = useState("");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });

  const listQ = useQuery({
    queryKey: ["news", "admin", scope, q, pagination.pageIndex, pagination.pageSize],
    queryFn: () =>
      listNewsAdmin({
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
    mutationFn: publishNewsAdmin,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["news"] }),
  });
  const unpublishM = useMutation({
    mutationFn: unpublishNewsAdmin,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["news"] }),
  });
  const softDelM = useMutation({
    mutationFn: softDeleteNewsAdmin,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["news"] }),
  });
  const hardDelM = useMutation({
    mutationFn: hardDeleteNewsAdmin,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["news"] }),
  });

  const columns = useMemo<ColumnDef<NewsRow>[]>(
    () => [
      {
        header: "Başlık",
        accessorKey: "title",
        cell: ({ row }) => (
          <Link
            className="font-medium text-zinc-900 hover:underline"
            to={`/news/${row.original.id}/edit`}
          >
            {row.original.title}
          </Link>
        ),
      },
      {
        header: "Kategori",
        accessorKey: "category",
      },
      {
        id: "status",
        header: "Durum",
        cell: ({ row }) => {
          const r = row.original;
          if (r.deletedAt) {
            return <Badge variant="outline">silindi</Badge>;
          }
          return r.publishedAt ? (
            <Badge className="bg-emerald-600">yayında</Badge>
          ) : (
            <Badge variant="secondary">taslak</Badge>
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
                  {r.publishedAt ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={unpublishM.isPending}
                      onClick={() => unpublishM.mutate(r.id)}
                    >
                      Yayından kaldır
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={publishM.isPending}
                      onClick={() => publishM.mutate(r.id)}
                    >
                      Yayınla
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-700"
                    disabled={softDelM.isPending}
                    onClick={() => {
                      if (confirm("Bu haberi çöp kutusuna taşımak istiyor musunuz?")) {
                        softDelM.mutate(r.id);
                      }
                    }}
                  >
                    Sil
                  </Button>
                </>
              )}
              {user?.role === "super_admin" && r.deletedAt && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={hardDelM.isPending}
                  onClick={() => {
                    if (
                      confirm(
                        "Kalıcı olarak silinecek. Bu işlem geri alınamaz. Emin misiniz?",
                      )
                    ) {
                      hardDelM.mutate(r.id);
                    }
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Haberler</h1>
          <p className="text-sm text-zinc-600">Liste, arama ve yayımlama</p>
        </div>
        <Button asChild>
          <Link to="/news/new">Yeni haber</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtreler</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="scope">Kapsam</Label>
            <select
              id="scope"
              className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm"
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
            <Label htmlFor="q">Ara</Label>
            <Input
              id="q"
              value={q}
              placeholder="Başlık…"
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
