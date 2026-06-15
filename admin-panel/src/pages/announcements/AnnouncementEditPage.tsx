import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useMatch, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import {
  createAnnouncementAdmin,
  getAnnouncementAdmin,
  patchAnnouncementAdmin,
} from "@/api/announcementsAdmin";
import { ApiError } from "@/api/http";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  isTicker: z.boolean().optional(),
  priority: z.coerce.number().optional(),
  expiresAt: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

export function AnnouncementEditPage() {
  const { id } = useParams<{ id: string }>();
  const isCreate = Boolean(useMatch({ path: "/announcements/new", end: true }));
  const navigate = useNavigate();
  const qc = useQueryClient();

  const detailQ = useQuery({
    queryKey: ["announcements", "one", id],
    queryFn: () => getAnnouncementAdmin(id!),
    enabled: !isCreate && Boolean(id),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      slug: "",
      title: "",
      body: "<p></p>",
      isTicker: false,
      priority: 0,
      expiresAt: null,
    },
  });

  useEffect(() => {
    if (!detailQ.data?.data) return;
    const d = detailQ.data.data;
    form.reset({
      slug: d.slug,
      title: d.title,
      body: d.body,
      isTicker: d.isTicker,
      priority: d.priority,
      expiresAt: d.expiresAt ? d.expiresAt.slice(0, 10) : null,
    });
  }, [detailQ.data, form]);

  const saveM = useMutation({
    mutationFn: async (vals: FormValues) => {
      const payload: Record<string, unknown> = {
        slug: vals.slug,
        title: vals.title,
        body: vals.body,
        isTicker: vals.isTicker,
        priority: vals.priority,
        expiresAt: vals.expiresAt ? new Date(vals.expiresAt) : null,
      };
      if (isCreate) {
        const res = await createAnnouncementAdmin(payload);
        return res.data;
      }
      const res = await patchAnnouncementAdmin(id!, payload);
      return res.data;
    },
    onSuccess: (row) => {
      void qc.invalidateQueries({ queryKey: ["announcements"] });
      if (isCreate) navigate(`/announcements/${row.id}/edit`, { replace: true });
    },
  });

  const onSubmit = form.handleSubmit(async (vals) => {
    try {
      await saveM.mutateAsync(vals);
    } catch (e) {
      form.setError("root", { message: e instanceof ApiError ? e.message : "Kayıt başarısız" });
    }
  });

  if (!isCreate && detailQ.isLoading) return <p className="text-sm text-zinc-600">Yükleniyor…</p>;
  if (!isCreate && detailQ.isError) return <p className="text-sm text-red-600">Bulunamadı.</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild className="px-0">
          <Link to="/announcements">← Duyurular</Link>
        </Button>
        <h1 className="text-2xl font-semibold">{isCreate ? "Yeni duyuru" : "Düzenle"}</h1>
      </div>
      <form onSubmit={onSubmit} className="space-y-6">
        {form.formState.errors.root && (
          <p className="text-sm text-red-600">{form.formState.errors.root.message}</p>
        )}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bilgiler</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Başlık</Label>
              <Input {...form.register("title")} />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input {...form.register("slug")} />
            </div>
            <div className="space-y-2">
              <Label>Öncelik</Label>
              <Input type="number" {...form.register("priority")} />
            </div>
            <div className="space-y-2">
              <Label>Bitiş tarihi (opsiyonel)</Label>
              <Input type="date" {...form.register("expiresAt")} />
              <p className="text-xs text-zinc-500">
                Boş bırakılırsa duyuru süresiz yayında kalır. Geçmiş bir tarih seçilirse sitede
                görünmez.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" {...form.register("isTicker")} id="tick" />
              <Label htmlFor="tick">Ticker</Label>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Metin</CardTitle>
          </CardHeader>
          <CardContent>
            <RichTextEditor
              value={form.watch("body")}
              onChange={(html) => form.setValue("body", html, { shouldDirty: true })}
            />
          </CardContent>
        </Card>
        <div className="flex gap-2">
          <Button type="submit" disabled={saveM.isPending}>
            Kaydet
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link to="/announcements">İptal</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
