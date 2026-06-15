import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useMatch, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { createNewsAdmin, getNewsAdmin, patchNewsAdmin } from "@/api/newsAdmin";
import { ApiError } from "@/api/http";
import { MediaPicker } from "@/components/MediaPicker";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  slug: z.string().min(1, "Gerekli"),
  title: z.string().min(1, "Gerekli"),
  excerpt: z.string().min(1, "Gerekli"),
  body: z.string().min(1, "İçerik gerekli"),
  category: z.string().min(1, "Gerekli"),
  tone: z.string().min(1, "Gerekli"),
  isFeatured: z.boolean().optional(),
  coverImage: z.union([z.string().uuid(), z.null()]).optional(),
});

type FormValues = z.infer<typeof schema>;

const defaults: FormValues = {
  slug: "",
  title: "",
  excerpt: "",
  body: "<p></p>",
  category: "genel",
  tone: "duyuru",
  isFeatured: false,
  coverImage: null,
};

export function NewsEditPage() {
  const { id } = useParams<{ id: string }>();
  const isCreate = Boolean(useMatch({ path: "/news/new", end: true }));
  const navigate = useNavigate();
  const qc = useQueryClient();

  const detailQ = useQuery({
    queryKey: ["news", "one", id],
    queryFn: () => getNewsAdmin(id!),
    enabled: !isCreate && Boolean(id),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });

  useEffect(() => {
    if (!detailQ.data?.data) return;
    const d = detailQ.data.data;
    form.reset({
      slug: d.slug ?? "",
      title: d.title ?? "",
      excerpt: d.excerpt ?? "",
      body: d.body || "<p></p>",
      category: d.category ?? "genel",
      tone: d.tone ?? "duyuru",
      isFeatured: d.isFeatured ?? false,
      coverImage: d.coverImage ?? null,
    });
  }, [detailQ.data, form]);

  const saveM = useMutation({
    mutationFn: async (vals: FormValues) => {
      if (isCreate) {
        const res = await createNewsAdmin(vals as unknown as Record<string, unknown>);
        return res.data;
      }
      const res = await patchNewsAdmin(id!, vals as unknown as Record<string, unknown>);
      return res.data;
    },
    onSuccess: (row) => {
      void qc.invalidateQueries({ queryKey: ["news"] });
      if (isCreate) {
        navigate(`/news/${row.id}/edit`, { replace: true });
      }
    },
  });

  const onSubmit = form.handleSubmit(
    async (vals) => {
      try {
        await saveM.mutateAsync(vals);
        toast.success("Haber kaydedildi.");
      } catch (e) {
        const msg = e instanceof ApiError ? e.message : String(e);
        form.setError("root", { message: msg });
        toast.error(msg);
      }
    },
    (errors) => {
      // Validation failed — show which fields are invalid
      const fields = Object.keys(errors).join(", ");
      toast.error(`Lütfen eksik alanları doldurun: ${fields}`);
    },
  );

  if (!isCreate && detailQ.isLoading) {
    return <p className="text-sm text-zinc-600">Yükleniyor…</p>;
  }
  if (!isCreate && detailQ.isError) {
    return <p className="text-sm text-red-600">Haber bulunamadı.</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="ghost" asChild className="px-0">
          <Link to="/news">← Haberler</Link>
        </Button>
        <h1 className="text-2xl font-semibold text-zinc-900">
          {isCreate ? "Yeni haber" : "Haberi düzenle"}
        </h1>
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
              <Label htmlFor="title">Başlık</Label>
              <Input id="title" {...form.register("title")} />
              {form.formState.errors.title && (
                <p className="text-xs text-red-600">{form.formState.errors.title.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" {...form.register("slug")} />
              {form.formState.errors.slug && (
                <p className="text-xs text-red-600">{form.formState.errors.slug.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              <Input id="category" {...form.register("category")} />
              {form.formState.errors.category && (
                <p className="text-xs text-red-600">{form.formState.errors.category.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="tone">Ton</Label>
              <Input id="tone" {...form.register("tone")} />
              {form.formState.errors.tone && (
                <p className="text-xs text-red-600">{form.formState.errors.tone.message}</p>
              )}
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" id="feat" {...form.register("isFeatured")} />
              <Label htmlFor="feat">Öne çıkan</Label>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Kapak</Label>
              <MediaPicker
                value={form.watch("coverImage") ?? null}
                onChange={(mid) => form.setValue("coverImage", mid, { shouldDirty: true })}
                acceptMimePrefix="image/"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="excerpt">Özet</Label>
              <Textarea id="excerpt" rows={3} {...form.register("excerpt")} />
              {form.formState.errors.excerpt && (
                <p className="text-xs text-red-600">{form.formState.errors.excerpt.message}</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">İçerik</CardTitle>
          </CardHeader>
          <CardContent>
            <RichTextEditor
              value={form.watch("body")}
              onChange={(html) => form.setValue("body", html, { shouldDirty: true })}
            />
            {form.formState.errors.body && (
              <p className="mt-2 text-xs text-red-600">{form.formState.errors.body.message}</p>
            )}
          </CardContent>
        </Card>
        <div className="flex gap-2">
          <Button type="submit" disabled={saveM.isPending}>
            {saveM.isPending ? "Kaydediliyor…" : "Kaydet"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link to="/news">İptal</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
