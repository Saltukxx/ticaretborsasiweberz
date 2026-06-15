import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import {
  CORPORATE_DOC_CATEGORY_LABELS,
  getCorporateDocumentAdmin,
  patchCorporateDocumentAdmin,
} from "@/api/corporateDocsAdmin";
import { ApiError } from "@/api/http";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  title: z.string().min(1, "Başlık gerekli"),
  summary: z.string(),
  body: z.string(),
  category: z.enum(["politika", "tarihce", "plan", "organizasyon"]),
  sortOrder: z.coerce.number().int().min(0),
  isPublished: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export function CorporateDocumentEditPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const detailQ = useQuery({
    queryKey: ["corporate", "documents", id],
    queryFn: () => getCorporateDocumentAdmin(id!),
    enabled: Boolean(id),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      summary: "",
      body: "<p></p>",
      category: "politika",
      sortOrder: 0,
      isPublished: true,
    },
  });

  useEffect(() => {
    if (!detailQ.data?.data) return;
    const d = detailQ.data.data;
    form.reset({
      title: d.title,
      summary: d.summary ?? "",
      body: d.body?.trim() ? d.body : "<p></p>",
      category: d.category as FormValues["category"],
      sortOrder: d.sortOrder,
      isPublished: d.isPublished,
    });
  }, [detailQ.data, form]);

  const saveM = useMutation({
    mutationFn: (vals: FormValues) =>
      patchCorporateDocumentAdmin(id!, {
        title: vals.title,
        summary: vals.summary.trim() || null,
        body: vals.body.trim() === "<p></p>" ? null : vals.body,
        category: vals.category,
        sortOrder: vals.sortOrder,
        isPublished: vals.isPublished,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["corporate", "documents"] });
    },
  });

  const doc = detailQ.data?.data;

  const onSubmit = form.handleSubmit(async (vals) => {
    try {
      await saveM.mutateAsync(vals);
      toast.success("Belge kaydedildi.");
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : String(e);
      form.setError("root", { message: msg });
      toast.error(msg);
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link className="text-sm text-zinc-600 hover:underline" to="/corporate-documents">
          ← Kurumsal belgeler
        </Link>
      </div>

      {detailQ.isLoading && <p className="text-sm text-zinc-500">Yükleniyor…</p>}

      {doc && (
        <form className="space-y-6" onSubmit={onSubmit}>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{doc.title}</h1>
            <p className="mt-1 text-sm text-zinc-500 mono">/{doc.slug}</p>
          </div>

          {form.formState.errors.root && (
            <p className="text-sm text-red-600">{form.formState.errors.root.message}</p>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Genel bilgiler</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="title">Başlık</Label>
                <Input id="title" {...form.register("title")} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="summary">Özet</Label>
                <Textarea id="summary" rows={3} {...form.register("summary")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                <select
                  id="category"
                  className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm"
                  {...form.register("category")}
                >
                  {Object.entries(CORPORATE_DOC_CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Sıra</Label>
                <Input id="sortOrder" type="number" {...form.register("sortOrder")} />
              </div>
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input type="checkbox" {...form.register("isPublished")} />
                Yayında
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sayfa içeriği</CardTitle>
            </CardHeader>
            <CardContent>
              <RichTextEditor
                value={form.watch("body")}
                onChange={(html) =>
                  form.setValue("body", html, { shouldDirty: true })
                }
              />
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="submit" disabled={saveM.isPending}>
              {saveM.isPending ? "Kaydediliyor…" : "Kaydet"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <a
                href={`/kurumsal/belgeler/${doc.slug}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Sitede önizle
              </a>
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
