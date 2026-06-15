import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useMatch, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { ApiError } from "@/api/http";
import { createGeoAdmin, getGeoAdmin, patchGeoAdmin } from "@/api/geoAdmin";
import { MediaPicker } from "@/components/MediaPicker";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  type: z.string().min(1),
  registrationNo: z.string().optional().nullable(),
  registeredAt: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
  isHighlight: z.boolean().optional(),
  story: z.string().optional().nullable(),
  coverImage: z.union([z.string().uuid(), z.null()]).optional(),
  sortOrder: z.coerce.number().optional(),
  isActive: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

export function GeoEditPage() {
  const { id } = useParams<{ id: string }>();
  const isCreate = Boolean(useMatch({ path: "/geo-indications/new", end: true }));
  const navigate = useNavigate();
  const qc = useQueryClient();

  const detailQ = useQuery({
    queryKey: ["geo", "one", id],
    queryFn: () => getGeoAdmin(id!),
    enabled: !isCreate && Boolean(id),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      slug: "",
      name: "",
      category: "",
      type: "",
      registrationNo: "",
      registeredAt: "",
      district: "",
      isHighlight: false,
      story: "",
      coverImage: null,
      sortOrder: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    if (!detailQ.data?.data) return;
    const d = detailQ.data.data;
    form.reset({
      slug: d.slug,
      name: d.name,
      category: d.category,
      type: d.type,
      registrationNo: d.registrationNo,
      registeredAt: d.registeredAt ? d.registeredAt.slice(0, 10) : "",
      district: d.district,
      isHighlight: d.isHighlight,
      story: d.story ?? "",
      coverImage: d.coverImage,
      sortOrder: d.sortOrder,
      isActive: d.isActive,
    });
  }, [detailQ.data, form]);

  const saveM = useMutation({
    mutationFn: async (vals: FormValues) => {
      const payload: Record<string, unknown> = {
        ...vals,
        registrationNo: vals.registrationNo || null,
        registeredAt: vals.registeredAt ? vals.registeredAt : null,
        district: vals.district || null,
        story: vals.story || null,
        coverImage: vals.coverImage ?? null,
      };
      if (isCreate) {
        const res = await createGeoAdmin(payload);
        return res.data;
      }
      return (await patchGeoAdmin(id!, payload)).data;
    },
    onSuccess: (row) => {
      void qc.invalidateQueries({ queryKey: ["geo"] });
      if (isCreate) navigate(`/geo-indications/${row.id}/edit`, { replace: true });
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
  if (!isCreate && detailQ.isError) return <p>Kayıt yok.</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild className="px-0">
          <Link to="/geo-indications">← Liste</Link>
        </Button>
        <h1 className="text-2xl font-semibold">{isCreate ? "Yeni kayıt" : "Düzenle"}</h1>
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
              <Label>Ad</Label>
              <Input {...form.register("name")} />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input {...form.register("slug")} />
            </div>
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Input {...form.register("category")} />
            </div>
            <div className="space-y-2">
              <Label>Tür</Label>
              <Input {...form.register("type")} />
            </div>
            <div className="space-y-2">
              <Label>Tescil no</Label>
              <Input {...form.register("registrationNo")} />
            </div>
            <div className="space-y-2">
              <Label>Tescil tarihi</Label>
              <Input type="date" {...form.register("registeredAt")} />
            </div>
            <div className="space-y-2">
              <Label>İlçe</Label>
              <Input {...form.register("district")} />
            </div>
            <div className="space-y-2">
              <Label>Sıra</Label>
              <Input type="number" {...form.register("sortOrder")} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="hi" {...form.register("isHighlight")} />
              <Label htmlFor="hi">Öne çıkan</Label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="ga" {...form.register("isActive")} />
              <Label htmlFor="ga">Sitede yayında (aktif)</Label>
            </div>
            <p className="text-xs text-zinc-500 md:col-span-2">
              İşaretli değilse kayıt admin panelinde kalır, ziyaretçi sayfasında listelenmez.
            </p>
            <div className="md:col-span-2">
              <Label>Kapak</Label>
              <MediaPicker
                value={form.watch("coverImage") ?? null}
                onChange={(mid) => form.setValue("coverImage", mid, { shouldDirty: true })}
                acceptMimePrefix="image/"
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hikâye</CardTitle>
          </CardHeader>
          <CardContent>
            <RichTextEditor
              value={form.watch("story") ?? ""}
              onChange={(html) => form.setValue("story", html, { shouldDirty: true })}
            />
          </CardContent>
        </Card>
        <div className="flex gap-2">
          <Button type="submit" disabled={saveM.isPending}>
            Kaydet
          </Button>
          <Button variant="outline" asChild>
            <Link to="/geo-indications">İptal</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
