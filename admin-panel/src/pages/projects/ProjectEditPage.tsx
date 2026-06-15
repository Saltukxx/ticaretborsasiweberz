import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Link, useMatch, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { ApiError } from "@/api/http";
import {
  createProjectAdmin,
  getProjectAdmin,
  patchProjectAdmin,
  type ProjectIcon,
  type ProjectRow,
  type ProjectStatus,
} from "@/api/projectsAdmin";
import { MediaPicker } from "@/components/MediaPicker";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const phaseSchema = z.object({
  label: z.string().min(1, "Faz adı gerekli"),
  done: z.boolean(),
});

const schema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  body: z.string().optional().nullable(),
  status: z.enum(["ongoing", "completed"]),
  field: z.string().optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).max(32767).optional(),
  coverImage: z.union([z.string().uuid(), z.null()]).optional(),
  startedAt: z.string().optional().nullable(),
  completedAt: z.string().optional().nullable(),
  isPublished: z.boolean().optional(),
  progress: z.coerce.number().int().min(0).max(100).optional().nullable(),
  targetLabel: z.string().max(100).optional().nullable(),
  phaseLabel: z.string().max(100).optional().nullable(),
  phases: z.array(phaseSchema).max(20),
  outputs: z.array(z.object({ value: z.string() })).max(30),
  icon: z.enum(["digital", "data", "lab"]).optional().nullable(),
  year: z.string().max(10).optional().nullable(),
  impact: z.string().max(500).optional().nullable(),
  result: z.string().max(5000).optional().nullable(),
  metricValue: z.string().max(50).optional().nullable(),
  metricLabel: z.string().max(200).optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

const ICON_OPTIONS: { value: ProjectIcon; label: string }[] = [
  { value: "digital", label: "Dijital" },
  { value: "data", label: "Veri" },
  { value: "lab", label: "Laboratuvar" },
];

const DEFAULT_PHASES = [
  { label: "Hazırlık", done: false },
  { label: "Tasarım", done: false },
  { label: "Pilot", done: false },
  { label: "Yayım", done: false },
];

function toFormValues(d: ProjectRow): FormValues {
  const normalizedStatus: ProjectStatus =
    d.status === "completed" ? "completed" : "ongoing";

  return {
    slug: d.slug,
    title: d.title,
    description: d.description ?? "",
    body: d.body ?? "",
    status: normalizedStatus,
    field: d.field ?? "",
    sortOrder: d.sortOrder ?? 0,
    coverImage: d.coverImage,
    startedAt: d.startedAt ? d.startedAt.slice(0, 10) : "",
    completedAt: d.completedAt ? d.completedAt.slice(0, 10) : "",
    isPublished: d.isPublished,
    progress: d.progress ?? 0,
    targetLabel: d.targetLabel ?? "",
    phaseLabel: d.phaseLabel ?? "",
    phases: d.phases?.length ? d.phases : DEFAULT_PHASES,
    outputs: (d.outputs ?? []).length
      ? d.outputs.map((value) => ({ value }))
      : [{ value: "" }],
    icon: d.icon ?? "digital",
    year: d.year ?? "",
    impact: d.impact ?? "",
    result: d.result ?? "",
    metricValue: d.metric?.value ?? "",
    metricLabel: d.metric?.label ?? "",
  };
}

function toPayload(vals: FormValues): Record<string, unknown> {
  const metric =
    vals.metricValue?.trim() && vals.metricLabel?.trim()
      ? { value: vals.metricValue.trim(), label: vals.metricLabel.trim() }
      : null;

  return {
    slug: vals.slug,
    title: vals.title,
    description: vals.description?.trim() ? vals.description.trim() : null,
    body: vals.body?.trim() ? vals.body.trim() : null,
    status: vals.status,
    field: vals.field?.trim() ? vals.field.trim() : null,
    sortOrder: vals.sortOrder ?? 0,
    coverImage: vals.coverImage ?? null,
    startedAt: vals.startedAt ? vals.startedAt : null,
    completedAt: vals.completedAt ? vals.completedAt : null,
    isPublished: vals.isPublished,
    progress: vals.status === "ongoing" ? (vals.progress ?? 0) : null,
    targetLabel:
      vals.status === "ongoing" && vals.targetLabel?.trim() ? vals.targetLabel.trim() : null,
    phaseLabel:
      vals.status === "ongoing" && vals.phaseLabel?.trim() ? vals.phaseLabel.trim() : null,
    phases: vals.status === "ongoing" ? vals.phases : [],
    outputs:
      vals.status === "ongoing"
        ? vals.outputs.map((o) => o.value.trim()).filter(Boolean)
        : [],
    icon: vals.status === "ongoing" ? (vals.icon ?? null) : null,
    year: vals.status === "completed" && vals.year?.trim() ? vals.year.trim() : null,
    impact: vals.status === "completed" && vals.impact?.trim() ? vals.impact.trim() : null,
    result: vals.status === "completed" && vals.result?.trim() ? vals.result.trim() : null,
    metric: vals.status === "completed" ? metric : null,
  };
}

export function ProjectEditPage() {
  const { id } = useParams<{ id: string }>();
  const isCreate = Boolean(useMatch({ path: "/projects/new", end: true }));
  const navigate = useNavigate();
  const qc = useQueryClient();

  const detailQ = useQuery({
    queryKey: ["projects", "one", id],
    queryFn: () => getProjectAdmin(id!),
    enabled: !isCreate && Boolean(id),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      slug: "",
      title: "",
      description: "",
      body: "",
      status: "ongoing",
      field: "",
      sortOrder: 0,
      coverImage: null,
      startedAt: "",
      completedAt: "",
      isPublished: false,
      progress: 0,
      targetLabel: "",
      phaseLabel: "",
      phases: DEFAULT_PHASES,
      outputs: [{ value: "" }],
      icon: "digital",
      year: "",
      impact: "",
      result: "",
      metricValue: "",
      metricLabel: "",
    },
  });

  const phasesArray = useFieldArray({ control: form.control, name: "phases" });
  const outputsArray = useFieldArray({ control: form.control, name: "outputs" });

  const status = form.watch("status");
  const progress = form.watch("progress") ?? 0;

  useEffect(() => {
    if (!detailQ.data?.data) return;
    form.reset(toFormValues(detailQ.data.data));
  }, [detailQ.data, form]);

  const saveM = useMutation({
    mutationFn: async (vals: FormValues) => {
      const payload = toPayload(vals);
      if (isCreate) {
        const res = await createProjectAdmin(payload);
        return res.data;
      }
      const res = await patchProjectAdmin(id!, payload);
      return res.data;
    },
    onSuccess: (row) => {
      void qc.invalidateQueries({ queryKey: ["projects"] });
      if (isCreate) navigate(`/projects/${row.id}/edit`, { replace: true });
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
          <Link to="/projects">← Projeler</Link>
        </Button>
        <h1 className="text-2xl font-semibold">{isCreate ? "Yeni proje" : "Düzenle"}</h1>
      </div>
      <form onSubmit={onSubmit} className="space-y-6">
        {form.formState.errors.root && (
          <p className="text-sm text-red-600">{form.formState.errors.root.message}</p>
        )}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Temel bilgiler</CardTitle>
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
              <Label>Proje türü</Label>
              <select
                className="h-10 w-full rounded-md border px-3 text-sm"
                {...form.register("status")}
              >
                <option value="ongoing">Devam eden</option>
                <option value="completed">Tamamlanan</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Odak alanı</Label>
              <Input placeholder="ör. Dijital Dönüşüm" {...form.register("field")} />
            </div>
            <div className="space-y-2">
              <Label>Sıra</Label>
              <Input type="number" min={0} {...form.register("sortOrder")} />
            </div>
            <div className="space-y-2">
              <Label>Başlangıç</Label>
              <Input type="date" {...form.register("startedAt")} />
            </div>
            <div className="space-y-2">
              <Label>Bitiş</Label>
              <Input type="date" {...form.register("completedAt")} />
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <input type="checkbox" id="ip" {...form.register("isPublished")} />
              <Label htmlFor="ip">Yayında</Label>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Özet</Label>
              <Textarea rows={4} {...form.register("description")} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Proje içeriği (detay sayfası)</Label>
              <RichTextEditor
                value={form.watch("body") ?? ""}
                onChange={(html) => form.setValue("body", html, { shouldDirty: true })}
              />
            </div>
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

        {status === "ongoing" ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Devam eden proje — vitrin alanları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>İkon</Label>
                  <select
                    className="h-10 w-full rounded-md border px-3 text-sm"
                    {...form.register("icon")}
                  >
                    {ICON_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Güncel faz etiketi</Label>
                  <Input placeholder="ör. Pilot kullanım" {...form.register("phaseLabel")} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Hedef tarih metni</Label>
                  <Input placeholder="ör. 2026 / 3. Çeyrek" {...form.register("targetLabel")} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>
                    İlerleme: <span className="font-mono">%{progress}</span>
                  </Label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    className="w-full"
                    {...form.register("progress", { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Proje fazları</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => phasesArray.append({ label: "", done: false })}
                  >
                    Faz ekle
                  </Button>
                </div>
                {phasesArray.fields.map((field, index) => (
                  <div key={field.id} className="flex flex-wrap items-center gap-2">
                    <Input
                      className="flex-1"
                      placeholder="Faz adı"
                      {...form.register(`phases.${index}.label`)}
                    />
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" {...form.register(`phases.${index}.done`)} />
                      Tamamlandı
                    </label>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-red-700"
                      onClick={() => phasesArray.remove(index)}
                    >
                      Sil
                    </Button>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Çıktılar</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => outputsArray.append({ value: "" })}
                  >
                    Çıktı ekle
                  </Button>
                </div>
                {outputsArray.fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <Input
                      className="flex-1"
                      placeholder="ör. Online başvuru"
                      {...form.register(`outputs.${index}.value`)}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-red-700"
                      onClick={() => outputsArray.remove(index)}
                    >
                      Sil
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tamamlanan proje — vitrin alanları</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Yıl (gösterim)</Label>
                <Input placeholder="ör. 2025" {...form.register("year")} />
              </div>
              <div className="space-y-2">
                <Label>Etki başlığı</Label>
                <Input placeholder="ör. Şeffaf fiyat yayını" {...form.register("impact")} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Sonuç metni</Label>
                <Textarea rows={2} {...form.register("result")} />
              </div>
              <div className="space-y-2">
                <Label>Metrik değeri</Label>
                <Input placeholder="ör. +34%" {...form.register("metricValue")} />
              </div>
              <div className="space-y-2">
                <Label>Metrik etiketi</Label>
                <Input
                  placeholder="ör. Bülten erişim düzenliliği"
                  {...form.register("metricLabel")}
                />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={saveM.isPending}>
            Kaydet
          </Button>
          <Button variant="outline" asChild>
            <Link to="/projects">İptal</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}