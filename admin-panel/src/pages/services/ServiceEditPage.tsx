import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useMatch, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { ApiError } from "@/api/http";
import { createServiceAdmin, getServiceAdmin, patchServiceAdmin } from "@/api/servicesAdmin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  icon: z.string().optional().nullable(),
  sortOrder: z.coerce.number().optional(),
  isActive: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

export function ServiceEditPage() {
  const { id } = useParams<{ id: string }>();
  const isCreate = Boolean(useMatch({ path: "/services/new", end: true }));
  const navigate = useNavigate();
  const qc = useQueryClient();

  const detailQ = useQuery({
    queryKey: ["services", "one", id],
    queryFn: () => getServiceAdmin(id!),
    enabled: !isCreate && Boolean(id),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      slug: "",
      title: "",
      description: "",
      icon: "",
      sortOrder: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    if (!detailQ.data?.data) return;
    const d = detailQ.data.data;
    form.reset({
      slug: d.slug,
      title: d.title,
      description: d.description,
      icon: d.icon,
      sortOrder: d.sortOrder,
      isActive: d.isActive,
    });
  }, [detailQ.data, form]);

  const saveM = useMutation({
    mutationFn: async (vals: FormValues) => {
      const payload: Record<string, unknown> = {
        ...vals,
        icon: vals.icon || null,
      };
      if (isCreate) {
        const res = await createServiceAdmin(payload);
        return res.data;
      }
      return (await patchServiceAdmin(id!, payload)).data;
    },
    onSuccess: (row) => {
      void qc.invalidateQueries({ queryKey: ["services"] });
      if (isCreate) navigate(`/services/${row.id}/edit`, { replace: true });
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
          <Link to="/services">← Hizmetler</Link>
        </Button>
        <h1 className="text-2xl font-semibold">{isCreate ? "Yeni hizmet" : "Düzenle"}</h1>
      </div>
      <form onSubmit={onSubmit} className="space-y-6">
        {form.formState.errors.root && (
          <p className="text-sm text-red-600">{form.formState.errors.root.message}</p>
        )}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alanlar</CardTitle>
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
              <Label>İkon (ops.)</Label>
              <Input {...form.register("icon")} />
            </div>
            <div className="space-y-2">
              <Label>Sıra</Label>
              <Input type="number" {...form.register("sortOrder")} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="act" {...form.register("isActive")} />
              <Label htmlFor="act">Aktif</Label>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Açıklama</Label>
              <Textarea rows={5} {...form.register("description")} />
            </div>
          </CardContent>
        </Card>
        <div className="flex gap-2">
          <Button type="submit" disabled={saveM.isPending}>
            Kaydet
          </Button>
          <Button variant="outline" asChild>
            <Link to="/services">İptal</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
