import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/api/http";
import {
  bulkPriceEntriesAdmin,
  createPriceEntryAdmin,
  createProductAdmin,
  deletePriceEntryAdmin,
  listPriceEntriesAdmin,
  listProductsAdmin,
  patchPriceEntryAdmin,
  patchProductAdmin,
  type PriceEntryRow,
  type ProductRow,
} from "@/api/pricesAdmin";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function PricesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Fiyatlar</h1>
        <p className="text-sm text-zinc-600">Ürünler, günlük satırlar ve toplu yükleme</p>
      </div>
      <Tabs defaultValue="entries">
        <TabsList>
          <TabsTrigger value="entries">Fiyat satırları</TabsTrigger>
          <TabsTrigger value="products">Ürünler</TabsTrigger>
          <TabsTrigger value="bulk">Toplu (JSON)</TabsTrigger>
        </TabsList>
        <TabsContent value="entries">
          <PriceEntriesPanel />
        </TabsContent>
        <TabsContent value="products">
          <ProductsPanel />
        </TabsContent>
        <TabsContent value="bulk">
          <BulkPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PriceEntriesPanel() {
  const qc = useQueryClient();
  const [productId, setProductId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 });

  const listQ = useQuery({
    queryKey: ["prices", "entries", productId, from, to, pagination],
    queryFn: () =>
      listPriceEntriesAdmin({
        limit: pagination.pageSize,
        offset: pagination.pageIndex * pagination.pageSize,
        productId: productId.trim() || undefined,
        from: from.trim() || undefined,
        to: to.trim() || undefined,
      }),
  });

  const delM = useMutation({
    mutationFn: deletePriceEntryAdmin,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["prices"] }),
  });

  const rows = listQ.data?.data ?? [];
  const total = listQ.data?.meta.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pagination.pageSize));

  const columns = useMemo<ColumnDef<PriceEntryRow>[]>(
    () => [
      {
        header: "Tarih",
        accessorKey: "entryDate",
      },
      {
        id: "prices",
        header: "Ort / Min / Max",
        cell: ({ row }) =>
          `${row.original.avgPrice} / ${row.original.lowPrice} / ${row.original.highPrice}`,
      },
      {
        id: "volume",
        header: "Hacim",
        cell: ({ row }) => row.original.volume ?? "—",
      },
      {
        id: "edit",
        header: "",
        cell: ({ row }) => (
          <RowEditDialog row={row.original} />
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-red-700"
            onClick={() => {
              if (confirm("Satır silinsin mi?")) delM.mutate(row.original.id);
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
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-end justify-between gap-4">
        <CardTitle className="text-base">Liste</CardTitle>
        <CreateEntryDialog />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>Ürün UUID</Label>
            <Input
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
              placeholder="productId"
            />
          </div>
          <div className="space-y-2">
            <Label>Başlangıç (YYYY-MM-DD)</Label>
            <Input
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
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
            />
          </div>
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
  );
}

function CreateEntryDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    productId: "",
    entryDate: new Date().toISOString().slice(0, 10),
    avgPrice: "",
    lowPrice: "",
    highPrice: "",
    changePct: "",
    volume: "",
    volumeUnit: "",
    sessionTime: "",
  });

  const mut = useMutation({
    mutationFn: () =>
      createPriceEntryAdmin({
        productId: form.productId,
        entryDate: form.entryDate,
        avgPrice: form.avgPrice,
        lowPrice: form.lowPrice,
        highPrice: form.highPrice,
        changePct: form.changePct || null,
        volume: form.volume || null,
        volumeUnit: form.volumeUnit || null,
        sessionTime: form.sessionTime || null,
      }),
    onSuccess: () => {
      setOpen(false);
      void qc.invalidateQueries({ queryKey: ["prices"] });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button">Yeni satır</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Yeni fiyat satırı</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="space-y-1">
            <Label>Ürün UUID</Label>
            <Input
              value={form.productId}
              onChange={(e) => setForm((f) => ({ ...f, productId: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label>Tarih</Label>
            <Input
              type="date"
              value={form.entryDate}
              onChange={(e) => setForm((f) => ({ ...f, entryDate: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label>Ort</Label>
              <Input
                value={form.avgPrice}
                onChange={(e) => setForm((f) => ({ ...f, avgPrice: e.target.value }))}
              />
            </div>
            <div>
              <Label>Min</Label>
              <Input
                value={form.lowPrice}
                onChange={(e) => setForm((f) => ({ ...f, lowPrice: e.target.value }))}
              />
            </div>
            <div>
              <Label>Max</Label>
              <Input
                value={form.highPrice}
                onChange={(e) => setForm((f) => ({ ...f, highPrice: e.target.value }))}
              />
            </div>
          </div>
          <Button
            type="button"
            disabled={mut.isPending}
            onClick={() => {
              mut.mutate(undefined, {
                onError: (e) => toast.error(e instanceof ApiError ? e.message : "Hata"),
              });
            }}
          >
            Kaydet
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RowEditDialog({ row }: { row: PriceEntryRow }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    avgPrice: row.avgPrice,
    lowPrice: row.lowPrice,
    highPrice: row.highPrice,
    changePct: row.changePct ?? "",
    volume: row.volume ?? "",
    volumeUnit: row.volumeUnit ?? "",
    sessionTime: row.sessionTime ?? "",
  });

  const mut = useMutation({
    mutationFn: () =>
      patchPriceEntryAdmin(row.id, {
        avgPrice: form.avgPrice,
        lowPrice: form.lowPrice,
        highPrice: form.highPrice,
        changePct: form.changePct || null,
        volume: form.volume || null,
        volumeUnit: form.volumeUnit || null,
        sessionTime: form.sessionTime || null,
      }),
    onSuccess: () => {
      setOpen(false);
      void qc.invalidateQueries({ queryKey: ["prices"] });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" type="button">
          Düzenle
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Satır düzenle</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2">
          <div className="grid grid-cols-3 gap-2">
            <Input
              value={form.avgPrice}
              onChange={(e) => setForm((f) => ({ ...f, avgPrice: e.target.value }))}
            />
            <Input
              value={form.lowPrice}
              onChange={(e) => setForm((f) => ({ ...f, lowPrice: e.target.value }))}
            />
            <Input
              value={form.highPrice}
              onChange={(e) => setForm((f) => ({ ...f, highPrice: e.target.value }))}
            />
          </div>
          <Button
            type="button"
            disabled={mut.isPending}
            onClick={() =>
              mut.mutate(undefined, {
                onError: (e) => toast.error(e instanceof ApiError ? e.message : "Hata"),
              })
            }
          >
            Güncelle
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProductsPanel() {
  const qc = useQueryClient();
  const listQ = useQuery({
    queryKey: ["products", "admin"],
    queryFn: () => listProductsAdmin(),
  });

  const rows = listQ.data?.data ?? [];

  const createM = useMutation({
    mutationFn: (body: Record<string, unknown>) => createProductAdmin(body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["products"] }),
  });

  const [form, setForm] = useState({
    slug: "",
    name: "",
    category: "",
    unit: "kg",
    isActive: true,
    sortOrder: "0",
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Yeni ürün</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Input
            placeholder="slug"
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
          />
          <Input
            placeholder="ad"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Input
            placeholder="kategori"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          />
          <Input
            placeholder="birim"
            value={form.unit}
            onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
          />
          <Input
            placeholder="sıra"
            value={form.sortOrder}
            onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            />
            Aktif
          </label>
          <Button
            type="button"
            className="md:col-span-2"
            disabled={createM.isPending}
            onClick={() =>
              createM.mutate(
                {
                  slug: form.slug,
                  name: form.name,
                  category: form.category,
                  unit: form.unit,
                  isActive: form.isActive,
                  sortOrder: Number(form.sortOrder),
                },
                {
                  onError: (e) => toast.error(e instanceof ApiError ? e.message : "Hata"),
                },
              )
            }
          >
            Ürün ekle
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ürün listesi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-2">Slug</th>
                  <th className="p-2">Ad</th>
                  <th className="p-2">Aktif</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p: ProductRow) => (
                  <ProductRowActions key={p.id} product={p} />
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ProductRowActions({ product }: { product: ProductRow }) {
  const qc = useQueryClient();
  const patchM = useMutation({
    mutationFn: (isActive: boolean) => patchProductAdmin(product.id, { isActive }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["products"] }),
  });
  return (
    <tr className="border-b border-zinc-100">
      <td className="p-2 font-mono text-xs">{product.slug}</td>
      <td className="p-2">{product.name}</td>
      <td className="p-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={patchM.isPending}
          onClick={() => patchM.mutate(!product.isActive)}
        >
          {product.isActive ? "pasif" : "aktif"}
        </Button>
      </td>
    </tr>
  );
}

function BulkPanel() {
  const qc = useQueryClient();
  const [text, setText] = useState("[]");
  const mut = useMutation({
    mutationFn: async () => {
      const rows = JSON.parse(text) as unknown[];
      return bulkPriceEntriesAdmin(rows);
    },
    onSuccess: (res) => {
      toast.success(`${res.data.upserted} kayıt içe aktarıldı.`);
      void qc.invalidateQueries({ queryKey: ["prices"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "JSON hatası"),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Toplu yükleme</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-zinc-600">
          Bir JSON dizisi beklenir:{" "}
          <code className="rounded bg-zinc-100 px-1">
            productSlug, entryDate, avgPrice, lowPrice, highPrice, ...
          </code>
        </p>
        <Textarea rows={14} className="font-mono text-xs" value={text} onChange={(e) => setText(e.target.value)} />
        <Button type="button" disabled={mut.isPending} onClick={() => mut.mutate()}>
          Gönder
        </Button>
      </CardContent>
    </Card>
  );
}
