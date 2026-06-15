import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { getMapDistrictAdmin, patchMapDistrictAdmin } from "@/api/mapDistrictsAdmin";
import { ApiError } from "@/api/http";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  label: z.string().min(1),
  productLine: z.string().min(1),
  dailyVolume: z.string().min(1),
  memberCount: z.coerce.number().int().min(0),
  registrationCount: z.coerce.number().int().min(0),
  sortOrder: z.coerce.number().int().min(0),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export function MapDistrictEditPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const detailQ = useQuery({
    queryKey: ["map-districts", slug],
    queryFn: () => getMapDistrictAdmin(slug!),
    enabled: Boolean(slug),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      label: "",
      productLine: "",
      dailyVolume: "",
      memberCount: 0,
      registrationCount: 0,
      sortOrder: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    if (!detailQ.data?.data) return;
    const d = detailQ.data.data;
    form.reset({
      label: d.label,
      productLine: d.productLine,
      dailyVolume: d.dailyVolume,
      memberCount: d.memberCount,
      registrationCount: d.registrationCount,
      sortOrder: d.sortOrder,
      isActive: d.isActive,
    });
  }, [detailQ.data, form]);

  const saveM = useMutation({
    mutationFn: (vals: FormValues) => patchMapDistrictAdmin(slug!, vals),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["map-districts"] });
      navigate("/map-districts");
    },
  });

  const onSubmit = form.handleSubmit(async (vals) => {
    try {
      await saveM.mutateAsync(vals);
    } catch (e) {
      form.setError("root", { message: e instanceof ApiError ? e.message : "Hata" });
    }
  });

  if (detailQ.isLoading) return <p>Yükleniyor…</p>;
  if (detailQ.isError) return <p>Kayıt yok.</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild className="px-0">
          <Link to="/map-districts">← İlçeler</Link>
        </Button>
        <h1 className="text-2xl font-semibold">Düzenle: {slug}</h1>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {form.formState.errors.root && (
          <p className="text-sm text-red-600">{form.formState.errors.root.message}</p>
        )}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">İlçe verileri</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-2">
              <Label>Etiket</Label>
              <Input {...form.register("label")} />
            </div>
            <div className="space-y-2">
              <Label>Ürün / faaliyet satırı</Label>
              <Input {...form.register("productLine")} />
            </div>
            <div className="space-y-2">
              <Label>Günlük hacim metni</Label>
              <Input {...form.register("dailyVolume")} placeholder="ör. 62,4 ton" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Bağlı üye sayısı</Label>
                <Input type="number" min={0} {...form.register("memberCount")} />
              </div>
              <div className="space-y-2">
                <Label>Tescil işlemi sayısı</Label>
                <Input type="number" min={0} {...form.register("registrationCount")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Sıra</Label>
              <Input type="number" min={0} {...form.register("sortOrder")} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...form.register("isActive")} />
              Aktif (sitede göster)
            </label>
          </CardContent>
        </Card>
        <div className="flex gap-2">
          <Button type="submit" disabled={saveM.isPending}>
            Kaydet
          </Button>
          <Button variant="outline" asChild>
            <Link to="/map-districts">İptal</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
