import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  createCurrencyRateAdmin,
  deleteCurrencyRateAdmin,
  listCurrencyRatesAdmin,
} from "@/api/currencyAdmin";
import { ApiError } from "@/api/http";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CurrencyRatesPage() {
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 });

  const listQ = useQuery({
    queryKey: ["currency", code, pagination.pageIndex, pagination.pageSize],
    queryFn: () =>
      listCurrencyRatesAdmin({
        limit: pagination.pageSize,
        offset: pagination.pageIndex * pagination.pageSize,
        code: code.trim() || undefined,
      }),
  });

  const rows = listQ.data?.data ?? [];
  const total = listQ.data?.meta.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pagination.pageSize));

  const createM = useMutation({
    mutationFn: createCurrencyRateAdmin,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["currency"] });
      toast.success("Kur kaydı eklendi.");
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "Kayıt eklenemedi.");
    },
  });

  const deleteM = useMutation({
    mutationFn: deleteCurrencyRateAdmin,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["currency"] });
      toast.success("Kayıt silindi.");
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "Kayıt silinemedi.");
    },
  });

  const [form, setForm] = useState({
    code: "",
    label: "",
    rateValue: "",
    changePct: "",
    direction: "" as "" | "-1" | "0" | "1",
  });

  const columns = useMemo<ColumnDef<(typeof rows)[0]>[]>(
    () => [
      { header: "Kod", accessorKey: "code" },
      { header: "Etiket", accessorKey: "label" },
      { header: "Kur", accessorKey: "rateValue" },
      { header: "Değişim %", accessorKey: "changePct" },
      {
        id: "direction",
        header: "Yön",
        cell: ({ row }) => {
          const d = row.original.direction;
          if (d === 1) return "▲ Yukarı";
          if (d === -1) return "▼ Aşağı";
          if (d === 0) return "— Sabit";
          return "—";
        },
      },
      {
        id: "createdAt",
        header: "Tarih",
        cell: ({ row }) => new Date(row.original.createdAt).toLocaleString("tr-TR"),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-red-700 hover:text-red-800"
            disabled={deleteM.isPending}
            onClick={() => {
              if (confirm(`"${row.original.code}" kaydı silinsin mi?`)) {
                deleteM.mutate(row.original.id);
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    [deleteM],
  );

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    await createM.mutateAsync({
      code: form.code.trim(),
      label: form.label.trim() || null,
      rateValue: form.rateValue,
      changePct: form.changePct.trim() || null,
      direction:
        form.direction === "" ? null : Number.parseInt(form.direction, 10),
    });
    setForm({ code: "", label: "", rateValue: "", changePct: "", direction: "" });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Döviz kurları</h1>
        <p className="text-sm text-zinc-600">Anlık kur kayıtları (ekle / sil)</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Yeni anlık kayıt</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" onSubmit={onCreate}>
            <div className="space-y-2">
              <Label>Kod</Label>
              <Input
                required
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                placeholder="USD"
              />
            </div>
            <div className="space-y-2">
              <Label>Etiket</Label>
              <Input
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                placeholder="ABD Doları"
              />
            </div>
            <div className="space-y-2">
              <Label>Kur</Label>
              <Input
                required
                value={form.rateValue}
                onChange={(e) => setForm((f) => ({ ...f, rateValue: e.target.value }))}
                placeholder="32.5400"
              />
            </div>
            <div className="space-y-2">
              <Label>Değişim %</Label>
              <Input
                value={form.changePct}
                onChange={(e) => setForm((f) => ({ ...f, changePct: e.target.value }))}
                placeholder="0.25"
              />
            </div>
            <div className="space-y-2">
              <Label>Yön</Label>
              <select
                className="h-10 w-full rounded-md border px-3 text-sm"
                value={form.direction}
                onChange={(e) =>
                  setForm((f) => ({ ...f, direction: e.target.value as typeof form.direction }))
                }
              >
                <option value="">—</option>
                <option value="1">Yukarı</option>
                <option value="0">Sabit</option>
                <option value="-1">Aşağı</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={createM.isPending}>
                Ekle
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Liste</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-xs space-y-2">
            <Label>Kod filtresi</Label>
            <Input
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
              placeholder="Örn. USD"
            />
          </div>
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
