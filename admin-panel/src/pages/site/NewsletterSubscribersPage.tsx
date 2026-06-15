import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import {
  downloadNewsletterCsv,
  listNewsletterSubscribersAdmin,
  type NewsletterSubscriber,
} from "@/api/siteAdmin";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const FREQ_LABELS: Record<NewsletterSubscriber["frequency"], string> = {
  daily: "Günlük",
  weekly: "Haftalık",
  monthly: "Aylık",
};

export function NewsletterSubscribersPage() {
  const [statusFilter, setStatusFilter] = useState<"active" | "unsubscribed" | "all">("active");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 });
  const [exporting, setExporting] = useState(false);

  const listQ = useQuery({
    queryKey: ["newsletter-subscribers", statusFilter, pagination],
    queryFn: () =>
      listNewsletterSubscribersAdmin({
        limit: pagination.pageSize,
        offset: pagination.pageIndex * pagination.pageSize,
        status: statusFilter,
      }),
  });

  const rows = listQ.data?.data ?? [];
  const total = listQ.data?.meta.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pagination.pageSize));

  const columns = useMemo<ColumnDef<NewsletterSubscriber>[]>(
    () => [
      { id: "email", header: "E-posta", accessorKey: "email" },
      {
        id: "frequency",
        header: "Sıklık",
        cell: ({ row }) => FREQ_LABELS[row.original.frequency],
      },
      {
        id: "status",
        header: "Durum",
        cell: ({ row }) => (
          <Badge variant={row.original.status === "active" ? "default" : "outline"}>
            {row.original.status === "active" ? "Aktif" : "Ayrıldı"}
          </Badge>
        ),
      },
      {
        id: "createdAt",
        header: "Kayıt",
        cell: ({ row }) =>
          new Date(row.original.createdAt).toLocaleString("tr-TR"),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">E-bülten aboneleri</h1>
        <Button
          type="button"
          variant="outline"
          disabled={exporting}
          onClick={async () => {
            setExporting(true);
            try {
              await downloadNewsletterCsv(statusFilter);
            } finally {
              setExporting(false);
            }
          }}
        >
          CSV indir
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">Abone listesi</CardTitle>
          <div className="flex gap-2">
            {(["active", "unsubscribed", "all"] as const).map((s) => (
              <Button
                key={s}
                type="button"
                size="sm"
                variant={statusFilter === s ? "default" : "outline"}
                onClick={() => {
                  setStatusFilter(s);
                  setPagination((p) => ({ ...p, pageIndex: 0 }));
                }}
              >
                {s === "active" ? "Aktif" : s === "unsubscribed" ? "Ayrılan" : "Tümü"}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
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
    </div>
  );
}
