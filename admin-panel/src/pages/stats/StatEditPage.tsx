import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useMatch, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { ApiError } from "@/api/http";
import { createStatAdmin, getStatAdmin, patchStatAdmin } from "@/api/statsAdmin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
  suffix: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  groupKey: z.string().max(50).optional().nullable(),
  sortOrder: z.coerce.number().optional(),
});

type FormValues = z.infer<typeof schema>;

export function StatEditPage() {
  const { id } = useParams<{ id: string }>();
  const isCreate = Boolean(useMatch({ path: "/stats/new", end: true }));
  const navigate = useNavigate();
  const qc = useQueryClient();

  const detailQ = useQuery({
    queryKey: ["stats", "one", id],
    queryFn: () => getStatAdmin(id!),
    enabled: !isCreate && Boolean(id),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      label: "",
      value: "",
      suffix: "",
      note: "",
      groupKey: "",
      sortOrder: 0,
    },
  });

  useEffect(() => {
    if (!detailQ.data?.data) return;
    const d = detailQ.data.data;
    form.reset({
      label: d.label,
      value: d.value,
      suffix: d.suffix,
      note: d.note,
      groupKey: d.groupKey ?? "",
      sortOrder: d.sortOrder,
    });
  }, [detailQ.data, form]);

  const saveM = useMutation({
    mutationFn: async (vals: FormValues) => {
      const payload: Record<string, unknown> = {
        label: vals.label,
        value: vals.value,
        suffix: vals.suffix || null,
        note: vals.note || null,
        groupKey: vals.groupKey?.trim() ? vals.groupKey.trim() : null,
        sortOrder: vals.sortOrder,
      };
      if (isCreate) {
        const res = await createStatAdmin(payload);
        return res.data;
      }
      return (await patchStatAdmin(id!, payload)).data;
    },
    onSuccess: (row) => {
      void qc.invalidateQueries({ queryKey: ["stats"] });
      if (isCreate) navigate(`/stats/${row.id}/edit`, { replace: true });
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
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild className="px-0">
          <Link to="/stats">← Liste</Link>
        </Button>
        <h1 className="text-2xl font-semibold">{isCreate ? "Yeni" : "Düzenle"}</h1>
      </div>
      <form onSubmit={onSubmit} className="space-y-6">
        {form.formState.errors.root && (
          <p className="text-sm text-red-600">{form.formState.errors.root.message}</p>
        )}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alanlar</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-2">
              <Label>Etiket</Label>
              <Input {...form.register("label")} />
            </div>
            <div className="space-y-2">
              <Label>Değer</Label>
              <Input {...form.register("value")} />
            </div>
            <div className="space-y-2">
              <Label>Suffix</Label>
              <Input {...form.register("suffix")} />
            </div>
            <div className="space-y-2">
              <Label>Not</Label>
              <Input {...form.register("note")} />
            </div>
            <div className="space-y-2">
              <Label>Grup (boş = ana sayfa; projects_impact = projeler etki)</Label>
              <Input placeholder="ör. projects_impact" {...form.register("groupKey")} />
              {form.watch("groupKey")?.trim() === "projects_impact" ? (
                <p className="text-xs text-muted-foreground">
                  Değer yalnızca sayı olmalıdır (ör. 6 veya 12.5).
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label>Sıra</Label>
              <Input type="number" {...form.register("sortOrder")} />
            </div>
          </CardContent>
        </Card>
        <div className="flex gap-2">
          <Button type="submit" disabled={saveM.isPending}>
            Kaydet
          </Button>
          <Button variant="outline" asChild>
            <Link to="/stats">İptal</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}

