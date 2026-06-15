import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useMatch, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { ApiError } from "@/api/http";
import { createReportAdmin, getReportAdmin, patchReportAdmin } from "@/api/reportsAdmin";
import { MediaPicker } from "@/components/MediaPicker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  summary: z.string().optional().nullable(),
  type: z.string().min(1),
  periodLabel: z.string().optional().nullable(),
  fileId: z.string().uuid(),
  reportDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isPublished: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

export function ReportEditPage() {
  const { id } = useParams<{ id: string }>();
  const isCreate = Boolean(useMatch({ path: "/reports/new", end: true }));
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

  const detailQ = useQuery({
    queryKey: ["reports", "one", id],
    queryFn: () => getReportAdmin(id!),
    enabled: !isCreate && Boolean(id),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      slug: "",
      name: "",
      summary: "",
      type: "bulten",
      periodLabel: "",
      fileId: "",
      reportDate: new Date().toISOString().slice(0, 10),
      isPublished: false,
    },
  });

  useEffect(() => {
    if (!detailQ.data?.data) return;
    const d = detailQ.data.data;
    form.reset({
      slug: d.slug,
      name: d.name,
      summary: d.summary,
      type: d.type,
      periodLabel: d.periodLabel,
      fileId: d.fileId,
      reportDate: d.reportDate,
      isPublished: d.isPublished,
    });
    setPdfPreviewUrl(null);
  }, [detailQ.data, form]);

  const saveM = useMutation({
    mutationFn: async (vals: FormValues) => {
      const payload: Record<string, unknown> = { ...vals, summary: vals.summary || null, periodLabel: vals.periodLabel || null };
      if (isCreate) {
        const res = await createReportAdmin(payload);
        return res.data;
      }
      const res = await patchReportAdmin(id!, payload);
      return res.data;
    },
    onSuccess: (row) => {
      void qc.invalidateQueries({ queryKey: ["reports"] });
      if (isCreate) navigate(`/reports/${row.id}/edit`, { replace: true });
    },
  });

  const onSubmit = form.handleSubmit(async (vals) => {
    try {
      await saveM.mutateAsync(vals);
    } catch (e) {
      form.setError("root", { message: e instanceof ApiError ? e.message : "Hata" });
    }
  });

  if (!isCreate && detailQ.isLoading) return <p>Yükleniyor…</p>;
  if (!isCreate && detailQ.isError) return <p>Bulunamadı.</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild className="px-0">
          <Link to="/reports">← Raporlar</Link>
        </Button>
        <h1 className="text-2xl font-semibold">{isCreate ? "Yeni rapor" : "Düzenle"}</h1>
      </div>
      <form onSubmit={onSubmit} className="space-y-6">
        {form.formState.errors.root && (
          <p className="text-sm text-red-600">{form.formState.errors.root.message}</p>
        )}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Meta</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Ad</Label>
              <Input {...form.register("name")} />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input {...form.register("slug")} />
            </div>
            <div className="space-y-2">
              <Label>Tür</Label>
              <Input {...form.register("type")} />
            </div>
            <div className="space-y-2">
              <Label>Rapor tarihi</Label>
              <Input type="date" {...form.register("reportDate")} />
            </div>
            <div className="space-y-2">
              <Label>Dönem etiketi</Label>
              <Input {...form.register("periodLabel")} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Özet</Label>
              <Textarea rows={3} {...form.register("summary")} />
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <input type="checkbox" id="pub" {...form.register("isPublished")} />
              <Label htmlFor="pub">Yayında olarak işaretle</Label>
            </div>
            <div className="md:col-span-2">
              <Label>PDF dosyası</Label>
              <MediaPicker
                label="PDF seç veya yükle"
                value={form.watch("fileId") || null}
                onChange={(mid, previewUrl) => {
                  form.setValue("fileId", mid ?? "", { shouldDirty: true });
                  setPdfPreviewUrl(previewUrl ?? null);
                }}
                acceptMimePrefix="application/pdf"
              />
              {!form.watch("fileId") && (
                <p className="mt-1 text-xs text-amber-700">Yükleme veya seçim zorunlu</p>
              )}
              {form.watch("fileId") && (
                <p className="mt-2 text-xs text-zinc-600">
                  Kayıt sonrası ziyaretçiler site üzerinden PDF indirebilir.
                  {pdfPreviewUrl && (
                    <>
                      {" "}
                      <span className="text-zinc-500">
                        (Önizleme kayıt ve yayın sonrası siteden yapılır.)
                      </span>
                    </>
                  )}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        <div className="flex gap-2">
          <Button type="submit" disabled={saveM.isPending || !form.watch("fileId")}>
            Kaydet
          </Button>
          <Button variant="outline" asChild>
            <Link to="/reports">İptal</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
