import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { deleteStatAdmin, listStatsAdmin, type StatRow } from "@/api/statsAdmin";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function StatsListPage() {
  const qc = useQueryClient();
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 });

  const listQ = useQuery({
    queryKey: ["stats", pagination.pageIndex, pagination.pageSize],
    queryFn: () =>
      listStatsAdmin({
        limit: pagination.pageSize,
        offset: pagination.pageIndex * pagination.pageSize,
      }),
  });

  const delM = useMutation({
    mutationFn: deleteStatAdmin,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["stats"] }),
  });

  const rows = listQ.data?.data ?? [];
  const total = listQ.data?.meta.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pagination.pageSize));

  const columns = useMemo<ColumnDef<StatRow>[]>(
    () => [
      {
        id: "label",
        header: "Etiket",
        cell: ({ row }) => (
          <Link className="font-medium hover:underline" to={`/stats/${row.original.id}/edit`}>
            {row.original.label}
          </Link>
        ),
      },
      { header: "Değer", accessorKey: "value" },
      { header: "Son ek", accessorKey: "suffix" },
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
          <h1 className="text-2xl font-semibold">İstatistikler</h1>
        </div>
        <Button asChild>
          <Link to="/stats/new">Yeni</Link>
        </Button>
      </div>
      <Card>
        <CardContent className="pt-6">
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
        </CardContent>
      </Card>
    </div>
  );
}
