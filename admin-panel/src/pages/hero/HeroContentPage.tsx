import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useFieldArray, useForm, type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { getHeroContentAdmin, patchHeroContentAdmin } from "@/api/heroAdmin";
import { ApiError } from "@/api/http";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const kpiSchema = z.object({
  label: z.string().min(1, "Etiket gerekli"),
  value: z.string().min(1, "Değer gerekli"),
  valueSuffix: z.string().optional(),
  highlighted: z.boolean().optional(),
});

const heroSchema = z.object({
  eyebrow: z.string().min(1),
  titleLead: z.string().min(1),
  titleEmphasis: z.string().min(1),
  titleSuffix: z.string().min(1),
  titleTagline: z.string().min(1),
  description: z.string().min(1),
  ctaPrimaryLabel: z.string().min(1),
  ctaPrimaryHref: z.string().min(1),
  ctaSecondaryLabel: z.string().min(1),
  ctaSecondaryHref: z.string().min(1),
  ctaLinkLabel: z.string().min(1),
  ctaLinkHref: z.string().min(1),
  kpis: z.array(kpiSchema).min(1).max(6),
});

type HeroForm = z.infer<typeof heroSchema>;

type TextFieldName = Exclude<keyof HeroForm, "kpis" | "description">;

const defaultKpis: HeroForm["kpis"] = [
  { label: "Kurucu Yıl", value: "1946", valueSuffix: "", highlighted: false },
  { label: "Aktif Üye", value: "1.842", valueSuffix: "", highlighted: false },
  { label: "Günlük Hacim", value: "284", valueSuffix: ",5 t", highlighted: false },
  { label: "Endeks", value: "▲ 1.284,5", valueSuffix: "", highlighted: true },
];

function TextFieldInner({
  label,
  name,
  form,
  className,
}: {
  label: string;
  name: TextFieldName;
  form: UseFormReturn<HeroForm>;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} {...form.register(name)} />
    </div>
  );
}

export function HeroContentPage() {
  const qc = useQueryClient();

  const heroQ = useQuery({
    queryKey: ["hero"],
    queryFn: getHeroContentAdmin,
  });

  const form = useForm<HeroForm>({
    resolver: zodResolver(heroSchema),
    defaultValues: {
      eyebrow: "",
      titleLead: "",
      titleEmphasis: "",
      titleSuffix: "",
      titleTagline: "",
      description: "",
      ctaPrimaryLabel: "",
      ctaPrimaryHref: "",
      ctaSecondaryLabel: "",
      ctaSecondaryHref: "",
      ctaLinkLabel: "",
      ctaLinkHref: "",
      kpis: defaultKpis,
    },
  });

  const kpiFields = useFieldArray({ control: form.control, name: "kpis" });

  useEffect(() => {
    if (!heroQ.data?.data) return;
    const h = heroQ.data.data;
    form.reset({
      eyebrow: h.eyebrow,
      titleLead: h.titleLead,
      titleEmphasis: h.titleEmphasis,
      titleSuffix: h.titleSuffix,
      titleTagline: h.titleTagline,
      description: h.description,
      ctaPrimaryLabel: h.ctaPrimaryLabel,
      ctaPrimaryHref: h.ctaPrimaryHref,
      ctaSecondaryLabel: h.ctaSecondaryLabel,
      ctaSecondaryHref: h.ctaSecondaryHref,
      ctaLinkLabel: h.ctaLinkLabel,
      ctaLinkHref: h.ctaLinkHref,
      kpis: h.kpis.map((k) => ({
        label: k.label,
        value: k.value,
        valueSuffix: k.valueSuffix ?? "",
        highlighted: k.highlighted ?? false,
      })),
    });
  }, [heroQ.data, form]);

  const saveM = useMutation({
    mutationFn: (vals: HeroForm) =>
      patchHeroContentAdmin({
        ...vals,
        kpis: vals.kpis.map((k) => ({
          label: k.label,
          value: k.value,
          valueSuffix: k.valueSuffix?.trim() || undefined,
          highlighted: k.highlighted || undefined,
        })),
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["hero"] }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ana sayfa hero</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Ziyaretçilerin ilk gördüğü başlık, açıklama, butonlar ve KPI şeridi.
        </p>
      </div>

      {heroQ.isError ? (
        <p className="text-sm text-red-600">
          {heroQ.error instanceof ApiError
            ? heroQ.error.message
            : "Hero içeriği yüklenemedi."}
        </p>
      ) : null}

      <form
        onSubmit={form.handleSubmit((vals) => saveM.mutate(vals))}
        className="space-y-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>Başlık ve metin</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <TextFieldInner label="Üst satır (eyebrow)" name="eyebrow" form={form} />
            <TextFieldInner label="Başlık — 1. satır (scramble)" name="titleLead" form={form} />
            <TextFieldInner label="Başlık — vurgulu kelime" name="titleEmphasis" form={form} />
            <TextFieldInner label="Başlık — devam" name="titleSuffix" form={form} />
            <TextFieldInner
              label="Alt satır (tagline)"
              name="titleTagline"
              form={form}
              className="md:col-span-2"
            />
            <div className="md:col-span-2">
              <Label htmlFor="description">Açıklama</Label>
              <Textarea id="description" rows={4} {...form.register("description")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Butonlar</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <TextFieldInner label="Birincil buton metni" name="ctaPrimaryLabel" form={form} />
            <TextFieldInner label="Birincil buton linki" name="ctaPrimaryHref" form={form} />
            <TextFieldInner label="İkincil buton metni" name="ctaSecondaryLabel" form={form} />
            <TextFieldInner label="İkincil buton linki" name="ctaSecondaryHref" form={form} />
            <TextFieldInner label="Metin linki" name="ctaLinkLabel" form={form} />
            <TextFieldInner label="Metin linki URL" name="ctaLinkHref" form={form} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>KPI şeridi</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                kpiFields.append({ label: "", value: "", valueSuffix: "", highlighted: false })
              }
              disabled={kpiFields.fields.length >= 6}
            >
              KPI ekle
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {kpiFields.fields.map((field, index) => (
              <div
                key={field.id}
                className="grid gap-3 rounded-lg border border-zinc-200 p-4 md:grid-cols-4"
              >
                <div>
                  <Label>Etiket</Label>
                  <Input {...form.register(`kpis.${index}.label`)} />
                </div>
                <div>
                  <Label>Değer</Label>
                  <Input {...form.register(`kpis.${index}.value`)} />
                </div>
                <div>
                  <Label>Ek sonek (opsiyonel)</Label>
                  <Input
                    {...form.register(`kpis.${index}.valueSuffix`)}
                    placeholder=",5 t"
                  />
                  <p className="mt-1 text-xs text-zinc-500">
                    Örn. günlük hacim için &quot;,5 t&quot;
                  </p>
                </div>
                <div className="flex items-end gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" {...form.register(`kpis.${index}.highlighted`)} />
                    Yeşil vurgu
                  </label>
                  {kpiFields.fields.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => kpiFields.remove(index)}
                    >
                      Kaldır
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {saveM.isError ? (
          <p className="text-sm text-red-600">
            {saveM.error instanceof ApiError ? saveM.error.message : "Kayıt başarısız."}
          </p>
        ) : null}
        {saveM.isSuccess ? <p className="text-sm text-green-700">Kaydedildi.</p> : null}

        <Button type="submit" disabled={saveM.isPending || heroQ.isLoading}>
          {saveM.isPending ? "Kaydediliyor…" : "Kaydet"}
        </Button>
      </form>
    </div>
  );
}
