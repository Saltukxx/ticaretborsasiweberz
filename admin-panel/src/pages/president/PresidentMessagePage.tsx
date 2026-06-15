import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ApiError } from "@/api/http";
import { getPresidentAdmin, patchPresidentAdmin } from "@/api/presidentAdmin";
import { presidentMessageDefaults } from "@/data/presidentMessageDefaults";
import { MediaPicker } from "@/components/MediaPicker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  name: z.string().min(1),
  title: z.string().min(1),
  messageTitle: z.string().min(1).max(255),
  eyebrow: z.string().min(1).max(255),
  quotesText: z.string().min(1),
  portraitId: z.union([z.string().uuid(), z.null()]).optional(),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const defaultFormValues: FormValues = {
  name: presidentMessageDefaults.name,
  title: presidentMessageDefaults.role,
  messageTitle: presidentMessageDefaults.title,
  eyebrow: presidentMessageDefaults.eyebrow,
  quotesText: presidentMessageDefaults.quote.join("\n\n"),
  portraitId: null,
  isActive: true,
};

export function PresidentMessagePage() {
  const qc = useQueryClient();

  const presidentQ = useQuery({
    queryKey: ["president"],
    queryFn: getPresidentAdmin,
    retry: (count, err) => {
      if (err instanceof ApiError && err.code === "NOT_FOUND") return false;
      return count < 2;
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultFormValues,
  });

  useEffect(() => {
    if (presidentQ.data?.data) {
      const d = presidentQ.data.data;
      form.reset({
        name: d.name,
        title: d.title,
        messageTitle: d.messageTitle ?? presidentMessageDefaults.title,
        eyebrow: d.eyebrow ?? presidentMessageDefaults.eyebrow,
        quotesText: (d.quoteLines ?? presidentMessageDefaults.quote).join("\n\n"),
        portraitId: d.portraitId,
        isActive: d.isActive,
      });
      return;
    }

    if (
      presidentQ.isError &&
      presidentQ.error instanceof ApiError &&
      presidentQ.error.code === "NOT_FOUND"
    ) {
      form.reset(defaultFormValues);
    }
  }, [presidentQ.data, presidentQ.isError, presidentQ.error, form]);

  const saveM = useMutation({
    mutationFn: async (vals: FormValues) => {
      const quoteLines = vals.quotesText
        .split(/\n\s*\n/)
        .flatMap((block) => block.split("\n"))
        .map((s) => s.trim())
        .filter(Boolean);

      return patchPresidentAdmin({
        name: vals.name,
        title: vals.title,
        messageTitle: vals.messageTitle,
        eyebrow: vals.eyebrow,
        quoteLines,
        portraitId: vals.portraitId ?? null,
        isActive: vals.isActive,
      });
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["president"] }),
  });

  const onSubmit = form.handleSubmit(async (vals) => {
    try {
      await saveM.mutateAsync(vals);
    } catch (e) {
      form.setError("root", {
        message: e instanceof ApiError ? e.message : "Kayıt başarısız.",
      });
    }
  });

  const loading = presidentQ.isLoading;
  const isNew =
    presidentQ.isError &&
    presidentQ.error instanceof ApiError &&
    presidentQ.error.code === "NOT_FOUND";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PresidentHeader isNew={isNew} />

      {presidentQ.isError && !(presidentQ.error instanceof ApiError && presidentQ.error.code === "NOT_FOUND") ? (
        <p className="text-sm text-red-600">
          {presidentQ.error instanceof ApiError
            ? presidentQ.error.message
            : "Başkan mesajı yüklenemedi."}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-zinc-600">Yükleniyor…</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-6">
          {form.formState.errors.root ? (
            <p className="text-sm text-red-600">{form.formState.errors.root.message}</p>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Başkan</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="space-y-2">
                <Label>Üst satır (eyebrow)</Label>
                <Input {...form.register("eyebrow")} />
              </div>
              <div className="space-y-2">
                <Label>Mesaj başlığı (H2)</Label>
                <Input {...form.register("messageTitle")} />
              </div>
              <div className="space-y-2">
                <Label>Alıntı metni</Label>
                <Textarea rows={6} {...form.register("quotesText")} />
                <p className="text-xs text-zinc-500">Paragraflar arasında boş satır bırakın.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Ad soyad</Label>
                  <Input {...form.register("name")} />
                </div>
                <div className="space-y-2">
                  <Label>Ünvan</Label>
                  <Input {...form.register("title")} />
                </div>
              </div>
              <PresidentActiveCheckbox form={form} />
              <div>
                <Label>Portre fotoğrafı</Label>
                <MediaPicker
                  value={form.watch("portraitId") ?? null}
                  onChange={(mid) => form.setValue("portraitId", mid, { shouldDirty: true })}
                  acceptMimePrefix="image/"
                />
              </div>
            </CardContent>
          </Card>

          {saveM.isSuccess ? <p className="text-sm text-green-700">Kaydedildi.</p> : null}

          <Button type="submit" disabled={saveM.isPending}>
            {saveM.isPending ? "Kaydediliyor…" : isNew ? "Oluştur ve kaydet" : "Kaydet"}
          </Button>
        </form>
      )}
    </div>
  );
}

function PresidentHeader({ isNew }: { isNew: boolean }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Başkanın mesajı</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Ana sayfadaki başkan bandı metni ve portre görseli.
        {isNew ? " İlk kayıt henüz oluşturulmadı; kaydettiğinizde yayına alınır." : null}
      </p>
    </div>
  );
}

function PresidentActiveCheckbox({ form }: { form: ReturnType<typeof useForm<FormValues>> }) {
  return (
    <div className="flex items-center gap-2">
      <input type="checkbox" id="president-active" {...form.register("isActive")} />
      <Label htmlFor="president-active">Ana sayfada göster (aktif)</Label>
    </div>
  );
}
