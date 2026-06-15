import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  deleteLeadershipAdmin,
  leadershipGroupLabel,
  listLeadershipAdmin,
  type LeadershipRow,
} from "@/api/leadershipAdmin";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LeadershipListPage() {
  const qc = useQueryClient();
  const [active, setActive] = useState<"all" | "true" | "false">("all");
  const [q, setQ] = useState("");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 });

  const listQ = useQuery({
    queryKey: ["leadership", active, q, pagination.pageIndex, pagination.pageSize],
    queryFn: () =>
      listLeadershipAdmin({
        limit: pagination.pageSize,
        offset: pagination.pageIndex * pagination.pageSize,
        active,
        q: q.trim() || undefined,
      }),
  });

  const delM = useMutation({
    mutationFn: deleteLeadershipAdmin,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["leadership"] }),
  });

  const rows = listQ.data?.data ?? [];
  const total = listQ.data?.meta.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pagination.pageSize));

  const columns = useMemo<ColumnDef<LeadershipRow>[]>(
    () => [
      {
        id: "name",
        header: "Ad",
        cell: ({ row }) => (
          <Link
            className="font-medium hover:underline"
            to={`/leadership/${row.original.id}/edit`}
          >
            {row.original.name}
          </Link>
        ),
      },
      {
        id: "groupKey",
        header: "Grup",
        cell: ({ row }) => (
          <Badge variant="secondary">{leadershipGroupLabel(row.original.groupKey)}</Badge>
        ),
      },
      { header: "Rol", accessorKey: "roleKey" },
      { header: "Ünvan", accessorKey: "title" },
      {
        id: "isActive",
        header: "Aktif",
        cell: ({ row }) =>
          row.original.isActive ? (
            <Badge className="bg-emerald-600">evet</Badge>
          ) : (
            <Badge variant="secondary">hayır</Badge>
          ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="ghost"
            className="text-red-700"
            disabled={delM.isPending}
            onClick={() => {
              if (confirm("Silinsin mi?")) delM.mutate(row.original.id);
            }}
          >
            Sil
          </Button>
        ),
      },
    ],
    [delM],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold">Yönetim</h1>
        </div>
        <Button asChild>
          <Link to="/leadership/new">Yeni kişi</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtreler</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="space-y-2">
            <Label>Aktif</Label>
            <select
              className="h-10 rounded-md border px-3 text-sm"
              value={active}
              onChange={(e) => {
                setActive(e.target.value as typeof active);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
            >
              <option value="all">Tümü</option>
              <option value="true">Aktif</option>
              <option value="false">Pasif</option>
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
