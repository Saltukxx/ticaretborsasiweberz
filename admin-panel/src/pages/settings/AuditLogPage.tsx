import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { listAuditLogAdmin, type AuditLogRow } from "@/api/auditAdmin";
import { DataTable } from "@/components/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Pretty-prints a JSON value with syntax colouring via a <pre> block. */
function JsonViewer({ value }: { value: unknown }) {
  const [open, setOpen] = useState(false);
  if (value === null || value === undefined) return <span className="text-zinc-400 text-xs">—</span>;
  const pretty = JSON.stringify(value, null, 2);
  const preview = pretty.length > 60 ? pretty.slice(0, 57) + "…" : pretty;
  const isExpandable = pretty.length > 60;
  return (
    <div className="text-[11px]">
      {isExpandable && (
        <button
          type="button"
          className="flex items-center gap-0.5 text-zinc-500 hover:text-zinc-800"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          {open ? "gizle" : "göster"}
        </button>
      )}
      {open || !isExpandable ? (
        <pre className="mt-1 max-h-60 overflow-auto rounded bg-zinc-50 p-2 text-[10px] text-zinc-700 whitespace-pre-wrap">
          {pretty}
        </pre>
      ) : (
        <pre className="max-w-[220px] truncate text-zinc-400">{preview}</pre>
      )}
    </div>
  );
}

export function AuditLogPage() {
  const [q, setQ] = useState("");
  const [action, setAction] = useState("");
  const [adminId, setAdminId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 });

  const listQ = useQuery({
    queryKey: [
      "audit",
      q,
      action,
      adminId,
      from,
      to,
      pagination.pageIndex,
      pagination.pageSize,
    ],
    queryFn: () =>
      listAuditLogAdmin({
        limit: pagination.pageSize,
        offset: pagination.pageIndex * pagination.pageSize,
        q: q.trim() || undefined,
        action: action.trim() || undefined,
        adminId: adminId.trim() || undefined,
        from: from.trim() || undefined,
        to: to.trim() || undefined,
      }),
  });

  const rows = listQ.data?.data ?? [];
  const total = listQ.data?.meta.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pagination.pageSize));

  const columns = useMemo<ColumnDef<AuditLogRow>[]>(
    () => [
      {
        id: "createdAt",
        header: "Zaman",
        cell: ({ row }) =>
          new Date(row.original.createdAt).toLocaleString("tr-TR"),
      },
      { header: "İşlem", accessorKey: "action" },
      {
        id: "admin",
        header: "Yönetici",
        cell: ({ row }) => row.original.adminEmail ?? row.original.adminId,
      },
      { header: "Varlık", accessorKey: "entityType" },
      {
        id: "diff",
        header: "Detay",
        cell: ({ row }) => <JsonViewer value={row.original.diff} />,
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Denetim günlüğü</h1>
        <p className="text-sm text-zinc-600">Süper yönetici görünümü</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtreler</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label>Metin</Label>
            <Input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>İşlem</Label>
            <Input
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Yönetici UUID</Label>
            <Input
              value={adminId}
              onChange={(e) => {
                setAdminId(e.target.value);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Başlangıç</Label>
            <Input
              type="datetime-local"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Bitiş</Label>
            <Input
              type="datetime-local"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
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
