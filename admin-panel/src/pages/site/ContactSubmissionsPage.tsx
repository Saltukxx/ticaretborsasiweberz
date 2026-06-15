import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import {
  getContactSubmissionAdmin,
  listContactSubmissionsAdmin,
  patchContactSubmissionAdmin,
  type ContactSubmission,
} from "@/api/siteAdmin";
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
import { Label } from "@/components/ui/label";

const STATUS_LABELS: Record<ContactSubmission["status"], string> = {
  new: "Yeni",
  read: "Okundu",
  archived: "Arşiv",
};

function statusVariant(status: ContactSubmission["status"]) {
  if (status === "new") return "default" as const;
  if (status === "read") return "secondary" as const;
  return "outline" as const;
}

export function ContactSubmissionsPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<"all" | ContactSubmission["status"]>("all");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const listQ = useQuery({
    queryKey: ["contact-submissions", statusFilter, pagination],
    queryFn: () =>
      listContactSubmissionsAdmin({
        limit: pagination.pageSize,
        offset: pagination.pageIndex * pagination.pageSize,
        status: statusFilter,
      }),
  });

  const detailQ = useQuery({
    queryKey: ["contact-submission", selectedId],
    queryFn: () => getContactSubmissionAdmin(selectedId!),
    enabled: Boolean(selectedId),
  });

  const patchM = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ContactSubmission["status"] }) =>
      patchContactSubmissionAdmin(id, status),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["contact-submissions"] });
      void qc.invalidateQueries({ queryKey: ["contact-submission"] });
    },
  });

  const rows = listQ.data?.data ?? [];
  const total = listQ.data?.meta.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pagination.pageSize));
  const detail = detailQ.data?.data;

  const columns = useMemo<ColumnDef<ContactSubmission>[]>(
    () => [
      {
        id: "createdAt",
        header: "Tarih",
        cell: ({ row }) =>
          new Date(row.original.createdAt).toLocaleString("tr-TR"),
      },
      {
        id: "fullName",
        header: "Gönderen",
        cell: ({ row }) => (
          <button
            type="button"
            className="text-left font-medium hover:underline"
            onClick={() => setSelectedId(row.original.id)}
          >
            {row.original.fullName}
          </button>
        ),
      },
      { id: "subject", header: "Konu", accessorKey: "subject" },
      { id: "email", header: "E-posta", accessorKey: "email" },
      {
        id: "status",
        header: "Durum",
        cell: ({ row }) => (
          <Badge variant={statusVariant(row.original.status)}>
            {STATUS_LABELS[row.original.status]}
          </Badge>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">İletişim mesajları</h1>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">Gelen kutusu</CardTitle>
          <div className="flex flex-wrap gap-2">
            {(["all", "new", "read", "archived"] as const).map((s) => (
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
                {s === "all" ? "Tümü" : STATUS_LABELS[s]}
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

      <Dialog open={Boolean(selectedId)} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Mesaj detayı</DialogTitle>
          </DialogHeader>
          {detailQ.isLoading && <p className="text-sm text-zinc-500">Yükleniyor…</p>}
          {detail && (
            <div className="space-y-4 text-sm">
              <div>
                <Label className="text-zinc-500">Gönderen</Label>
                <p>{detail.fullName}</p>
                {detail.organization && <p className="text-zinc-600">{detail.organization}</p>}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <Label className="text-zinc-500">E-posta</Label>
                  <p>{detail.email}</p>
                </div>
                {detail.phone && (
                  <div>
                    <Label className="text-zinc-500">Telefon</Label>
                    <p>{detail.phone}</p>
                  </div>
                )}
              </div>
              <div>
                <Label className="text-zinc-500">Konu</Label>
                <p>{detail.subject}</p>
              </div>
              <div>
                <Label className="text-zinc-500">Mesaj</Label>
                <p className="whitespace-pre-wrap">{detail.message}</p>
              </div>
              <p className="text-xs text-zinc-400">
                {new Date(detail.createdAt).toLocaleString("tr-TR")}
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {(["read", "archived", "new"] as const).map((s) => (
                  <Button
                    key={s}
                    type="button"
                    size="sm"
                    variant={detail.status === s ? "default" : "outline"}
                    disabled={patchM.isPending || detail.status === s}
                    onClick={() => patchM.mutate({ id: detail.id, status: s })}
                  >
                    {STATUS_LABELS[s]}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
