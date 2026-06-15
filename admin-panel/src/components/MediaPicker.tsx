import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageIcon, Loader2, Upload } from "lucide-react";
import { useState } from "react";
import { listMediaAdmin, uploadMediaAdmin, type MediaRow } from "@/api/mediaAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Props = {
  label?: string;
  value: string | null;
  onChange: (mediaId: string | null, previewUrl?: string | null) => void;
  acceptMimePrefix?: string;
};

const PAGE = 20;

export function MediaPicker({ label = "Medya seç", value, onChange, acceptMimePrefix }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [offset, setOffset] = useState(0);

  const queryClient = useQueryClient();

  const listQ = useQuery({
    queryKey: ["media", "list", { q, offset, acceptMimePrefix }],
    queryFn: () =>
      listMediaAdmin({
        limit: PAGE,
        offset,
        q: q.trim() || undefined,
        mimePrefix: acceptMimePrefix,
      }),
    enabled: open,
  });

  const upload = useMutation({
    mutationFn: (file: File) => uploadMediaAdmin(file),
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ["media"] });
      const row = res.data;
      if (row) {
        onChange(row.id, row.publicUrl);
        setOpen(false);
      }
    },
  });

  const rows = listQ.data?.data ?? [];
  const total = listQ.data?.meta.total ?? 0;
  const selected = rows.find((r) => r.id === value);

  const handlePick = (row: MediaRow) => {
    onChange(row.id, row.publicUrl);
    setOpen(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {value && (
        <span className="text-xs text-zinc-500 font-mono">
          {selected?.originalName ?? value.slice(0, 8)}
        </span>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="gap-2">
            <ImageIcon className="h-4 w-4" />
            {label}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Medya kütüphanesi</DialogTitle>
            <DialogDescription>
              Görsel veya PDF yükleyin; listeden bir öğe seçin.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <Input
                placeholder="Ara…"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setOffset(0);
                }}
              />
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50">
                <Upload className="h-4 w-4" />
                Yükle
                <input
                  type="file"
                  className="hidden"
                  accept={
                    acceptMimePrefix === "image/"
                      ? "image/jpeg,image/png,image/webp,image/gif"
                      : acceptMimePrefix === "application/pdf"
                        ? "application/pdf"
                        : undefined
                  }
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (f) upload.mutate(f);
                  }}
                />
              </label>
            </div>
            {upload.isPending && (
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Yükleniyor…
              </div>
            )}
            {upload.error && (
              <p className="text-sm text-red-600">{(upload.error as Error).message}</p>
            )}
            <div className="max-h-72 overflow-auto rounded-md border border-zinc-100">
              {listQ.isLoading ? (
                <div className="p-6 text-center text-sm text-zinc-500">Yükleniyor…</div>
              ) : rows.length === 0 ? (
                <div className="p-6 text-center text-sm text-zinc-500">Sonuç yok</div>
              ) : (
                <ul className="divide-y divide-zinc-100">
                  {rows.map((row) => (
                    <li key={row.id}>
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-zinc-50"
                        onClick={() => handlePick(row)}
                      >
                        {row.mimeType.startsWith("image/") ? (
                          <img
                            src={row.publicUrl}
                            alt=""
                            className="h-10 w-10 rounded object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded bg-zinc-100 text-xs">
                            PDF
                          </div>
                        )}
                        <span className="flex-1 truncate">{row.originalName}</span>
                        {value === row.id && (
                          <span className="text-xs text-emerald-600">seçili</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex justify-between text-sm text-zinc-600">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={offset <= 0}
                onClick={() => setOffset((o) => Math.max(0, o - PAGE))}
              >
                Önceki
              </Button>
              <span>
                {total === 0 ? 0 : offset + 1}–{Math.min(offset + PAGE, total)} / {total}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={offset + PAGE >= total}
                onClick={() => setOffset((o) => o + PAGE)}
              >
                Sonraki
              </Button>
            </div>
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="self-start"
                onClick={() => onChange(null, null)}
              >
                Seçimi kaldır
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
