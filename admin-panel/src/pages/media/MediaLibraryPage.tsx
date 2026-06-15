import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Loader2, Pencil, Trash2, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/api/http";
import {
  deleteMediaAdmin,
  listMediaAdmin,
  patchMediaAdmin,
  uploadMediaAdmin,
  type MediaRow,
} from "@/api/mediaAdmin";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function MediaLibraryPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });

  // Alt-text edit dialog state
  const [editRow, setEditRow] = useState<MediaRow | null>(null);
  const [altDraft, setAltDraft] = useState("");

  const listQ = useQuery({
    queryKey: ["media", "page", q, pagination.pageIndex, pagination.pageSize],
    queryFn: () =>
      listMediaAdmin({
        limit: pagination.pageSize,
        offset: pagination.pageIndex * pagination.pageSize,
        q: q.trim() || undefined,
      }),
  });

  const uploadM = useMutation({
    mutationFn: uploadMediaAdmin,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["media"] });
      toast.success("Dosya yüklendi.");
    },
    onError: (err) => {
      if (err instanceof ApiError && err.code === "MEDIA_UNAVAILABLE") return; // shown inline
      toast.error((err as Error).message ?? "Yükleme başarısız.");
    },
  });

  const patchM = useMutation({
    mutationFn: ({ id, altText }: { id: string; altText: string | null }) =>
      patchMediaAdmin(id, altText),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["media"] });
      toast.success("Alt metin güncellendi.");
      setEditRow(null);
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "Güncellenemedi.");
    },
  });

  const delM = useMutation({
    mutationFn: deleteMediaAdmin,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["media"] });
      toast.success("Dosya silindi.");
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "Silinemedi.");
    },
  });

  const rows = listQ.data?.data ?? [];
  const total = listQ.data?.meta.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pagination.pageSize));

  const columns = useMemo<ColumnDef<MediaRow>[]>(
    () => [
      {
        id: "preview",
        header: "Önizleme",
        cell: ({ row }) =>
          row.original.mimeType.startsWith("image/") ? (
            <img
              src={row.original.publicUrl}
              alt={row.original.altText ?? ""}
              className="h-12 w-12 rounded object-cover"
            />
          ) : (
            <span className="text-xs text-zinc-500">PDF</span>
          ),
      },
      { header: "Dosya", accessorKey: "originalName" },
      { header: "MIME", accessorKey: "mimeType" },
      {
        id: "size",
        header: "Boyut",
        cell: ({ row }) => `${(row.original.sizeBytes / 1024).toFixed(0)} KB`,
      },
      {
        id: "altText",
        header: "Alt metin",
        cell: ({ row }) => (
          <span className="max-w-[160px] truncate text-xs text-zinc-500">
            {row.original.altText ?? <em className="italic">—</em>}
          </span>
        ),
      },
      {
        id: "url",
        header: "URL",
        cell: ({ row }) => (
          <a
            className="text-xs text-blue-600 hover:underline"
            href={row.original.publicUrl}
            target="_blank"
            rel="noreferrer"
          >
            aç
          </a>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex gap-1">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              title="Alt metni düzenle"
              onClick={() => {
                setEditRow(row.original);
                setAltDraft(row.original.altText ?? "");
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-red-700 hover:text-red-800"
              disabled={delM.isPending}
              onClick={() => {
                if (confirm("Dosya silinsin mi?")) delM.mutate(row.original.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [delM],
  );

  const mediaUnavailable =
    uploadM.error instanceof ApiError && uploadM.error.code === "MEDIA_UNAVAILABLE";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Medya kütüphanesi</h1>
        <p className="text-sm text-zinc-600">Görsel ve PDF yükleme</p>
      </div>

      {/* Alt-text edit dialog */}
      <Dialog open={editRow !== null} onOpenChange={(open) => { if (!open) setEditRow(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Alt metin düzenle</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Alt metin</Label>
            <Input
              value={altDraft}
              onChange={(e) => setAltDraft(e.target.value)}
              placeholder="Dosyayı açıklayan kısa metin…"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRow(null)}>
              İptal
            </Button>
            <Button
              disabled={patchM.isPending}
              onClick={() => {
                if (!editRow) return;
                patchM.mutate({
                  id: editRow.id,
                  altText: altDraft.trim() || null,
                });
              }}
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
          <CardTitle className="text-base">Yükle</CardTitle>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border bg-white px-4 py-2 text-sm">
            {uploadM.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Dosya seç
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) uploadM.mutate(f);
              }}
            />
          </label>
        </CardHeader>
        <CardContent>
          {mediaUnavailable && (
            <p className="text-sm text-amber-700">
              Depolama yapılandırılmadı (R2). LIST çalışır; yükleme API 503 dönebilir.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dosyalar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-md space-y-2">
            <Label>Ara</Label>
            <Input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
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

