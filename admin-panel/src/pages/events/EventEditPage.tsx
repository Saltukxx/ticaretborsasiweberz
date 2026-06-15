import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useMatch, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { createEventAdmin, getEventAdmin, patchEventAdmin } from "@/api/eventsAdmin";
import { ApiError } from "@/api/http";
import { MediaPicker } from "@/components/MediaPicker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  startsAt: z.string().min(1),
  endsAt: z.string().optional().nullable(),
  coverImage: z.union([z.string().uuid(), z.null()]).optional(),
  registrationOpen: z.boolean().optional(),
  isStakeholder: z.boolean().optional(),
  statusLabel: z.string().max(100).optional().nullable(),
  isPublished: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

function toLocal(dt: string) {
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventEditPage() {
  const { id } = useParams<{ id: string }>();
  const isCreate = Boolean(useMatch({ path: "/events/new", end: true }));
  const navigate = useNavigate();
  const qc = useQueryClient();

  const detailQ = useQuery({
    queryKey: ["events", "one", id],
    queryFn: () => getEventAdmin(id!),
    enabled: !isCreate && Boolean(id),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      slug: "",
      title: "",
      description: "",
      location: "",
      startsAt: "",
      endsAt: "",
      coverImage: null,
      registrationOpen: false,
      isStakeholder: false,
      statusLabel: "",
      isPublished: false,
    },
  });

  useEffect(() => {
    if (!detailQ.data?.data) return;
    const d = detailQ.data.data;
    form.reset({
      slug: d.slug,
      title: d.title,
      description: d.description ?? "",
      location: d.location ?? "",
      startsAt: toLocal(d.startsAt),
      endsAt: d.endsAt ? toLocal(d.endsAt) : "",
      coverImage: d.coverImage,
      registrationOpen: d.registrationOpen ?? false,
      isStakeholder: d.isStakeholder ?? false,
      statusLabel: d.statusLabel ?? "",
      isPublished: d.isPublished ?? false,
    });
  }, [detailQ.data, form]);

  const saveM = useMutation({
    mutationFn: async (vals: FormValues) => {
      const payload: Record<string, unknown> = {
        slug: vals.slug,
        title: vals.title,
        description: vals.description || null,
        location: vals.location || null,
        startsAt: new Date(vals.startsAt),
        endsAt: vals.endsAt ? new Date(vals.endsAt) : null,
        coverImage: vals.coverImage ?? null,
        registrationOpen: vals.registrationOpen ?? false,
        isStakeholder: vals.isStakeholder ?? false,
        statusLabel: vals.statusLabel?.trim() ? vals.statusLabel.trim() : null,
        isPublished: vals.isPublished ?? false,
      };
      if (isCreate) {
        const res = await createEventAdmin(payload);
        return res.data;
      }
      const res = await patchEventAdmin(id!, payload);
      return res.data;
    },
    onSuccess: (row) => {
      void qc.invalidateQueries({ queryKey: ["events"] });
      if (isCreate) navigate(`/events/${row.id}/edit`, { replace: true });
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
          <Link to="/events">← Etkinlikler</Link>
        </Button>
        <h1 className="text-2xl font-semibold">{isCreate ? "Yeni etkinlik" : "Düzenle"}</h1>
      </div>
      <form onSubmit={onSubmit} className="space-y-6">
        {form.formState.errors.root && (
          <p className="text-sm text-red-600">{form.formState.errors.root.message}</p>
        )}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bilgi</CardTitle>
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
              <Label>Konum</Label>
              <Input {...form.register("location")} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Açıklama</Label>
              <Textarea rows={3} {...form.register("description")} />
            </div>
            <div className="space-y-2">
              <Label>Başlangıç</Label>
              <Input type="datetime-local" {...form.register("startsAt")} />
            </div>
            <div className="space-y-2">
              <Label>Bitiş (ops.)</Label>
              <Input type="datetime-local" {...form.register("endsAt")} />
            </div>
            <div className="md:col-span-2">
              <Label>Kapak</Label>
              <MediaPicker
                value={form.watch("coverImage") ?? null}
                onChange={(mid) => form.setValue("coverImage", mid, { shouldDirty: true })}
                acceptMimePrefix="image/"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Durum etiketi (vitrin)</Label>
              <Input placeholder="ör. Planlandı, Kayıt açık" {...form.register("statusLabel")} />
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...form.register("registrationOpen")} />
              <span className="text-sm">Kayıt açık</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...form.register("isStakeholder")} />
              <span className="text-sm">Paydaş odaklı etkinlik</span>
            </label>
            <label className="flex items-center gap-2 md:col-span-2">
              <input type="checkbox" {...form.register("isPublished")} />
              <span className="text-sm">Yayında</span>
            </label>
          </CardContent>
        </Card>
        <div className="flex gap-2">
          <Button type="submit" disabled={saveM.isPending}>
            Kaydet
          </Button>
          <Button variant="outline" asChild>
            <Link to="/events">İptal</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}

