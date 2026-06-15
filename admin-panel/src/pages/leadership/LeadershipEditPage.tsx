import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Link, useMatch, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { ApiError } from "@/api/http";
import {
  LEADERSHIP_GROUPS,
  PRESIDENT_ROLE_KEY,
  createLeadershipAdmin,
  getLeadershipAdmin,
  leadershipGroupLabel,
  patchLeadershipAdmin,
  previewRoleKey,
} from "@/api/leadershipAdmin";
import { MediaPicker } from "@/components/MediaPicker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const groupKeyEnum = z.enum([
  "yonetim_kurulu",
  "meclis",
  "tobb_delegeleri",
  "personel",
  "danisman",
]);

const schema = z.object({
  roleKey: z.string().optional(),
  groupKey: groupKeyEnum,
  name: z.string().min(1),
  title: z.string().min(1),
  messageTitle: z.string().max(255).optional().nullable(),
  eyebrow: z.string().optional().nullable(),
  quotesText: z.string().optional(),
  portraitId: z.union([z.string().uuid(), z.null()]).optional(),
  sortOrder: z.coerce.number().optional(),
  isActive: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

function parseGroupParam(raw: string | null): FormValues["groupKey"] | undefined {
  if (!raw) return undefined;
  const parsed = groupKeyEnum.safeParse(raw);
  return parsed.success ? parsed.data : undefined;
}

export function LeadershipEditPage() {
  const { id } = useParams<{ id: string }>();
  const isCreate = Boolean(useMatch({ path: "/leadership/new", end: true }));
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const groupFromQuery = parseGroupParam(searchParams.get("group"));

  const detailQ = useQuery({
    queryKey: ["leadership", "one", id],
    queryFn: () => getLeadershipAdmin(id!),
    enabled: !isCreate && Boolean(id),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      roleKey: "",
      groupKey: groupFromQuery ?? "yonetim_kurulu",
      name: "",
      title: "",
      messageTitle: "",
      eyebrow: "",
      quotesText: "",
      portraitId: null,
      sortOrder: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    if (isCreate && groupFromQuery) {
      form.setValue("groupKey", groupFromQuery);
    }
  }, [isCreate, groupFromQuery, form]);

  useEffect(() => {
    if (!detailQ.data?.data) return;
    const d = detailQ.data.data;
    form.reset({
      roleKey: d.roleKey,
      groupKey: (d.groupKey as FormValues["groupKey"]) ?? "yonetim_kurulu",
      name: d.name,
      title: d.title,
      messageTitle: d.messageTitle ?? "",
      eyebrow: d.eyebrow,
      quotesText: (d.quoteLines ?? []).join("\n"),
      portraitId: d.portraitId,
      sortOrder: d.sortOrder,
      isActive: d.isActive,
    });
  }, [detailQ.data, form]);

  const watchedName = form.watch("name");
  const watchedGroup = form.watch("groupKey");
  const roleKeyPreview = useMemo(() => {
    if (!isCreate || !watchedName.trim()) return "";
    return previewRoleKey(watchedGroup, watchedName);
  }, [isCreate, watchedName, watchedGroup]);

  const saveM = useMutation({
    mutationFn: async (vals: FormValues) => {
      const quotes = vals.quotesText
        ? vals.quotesText
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
      const payload: Record<string, unknown> = {
        groupKey: vals.groupKey,
        name: vals.name,
        title: vals.title,
        messageTitle: vals.messageTitle?.trim() ? vals.messageTitle.trim() : null,
        eyebrow: vals.eyebrow || null,
        quoteLines: quotes.length ? quotes : null,
        portraitId: vals.portraitId ?? null,
        sortOrder: vals.sortOrder,
        isActive: vals.isActive,
      };
      if (!isCreate && vals.roleKey) {
        payload.roleKey = vals.roleKey;
      }
      if (isCreate) {
        const res = await createLeadershipAdmin(payload);
        return res.data;
      }
      return (await patchLeadershipAdmin(id!, payload)).data;
    },
    onSuccess: (row) => {
      void qc.invalidateQueries({ queryKey: ["leadership"] });
      if (isCreate) {
        navigate(`/leadership/${row.id}/edit`, { replace: true });
      } else {
        navigate("/leadership");
      }
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

  const isPresident = !isCreate && detailQ.data?.data.roleKey === PRESIDENT_ROLE_KEY;
  const isDanisman = form.watch("groupKey") === "danisman";
  const backHref = "/leadership";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild className="px-0">
          <Link to={backHref}>← Yönetim şeması</Link>
        </Button>
        <h1 className="text-2xl font-semibold">
          {isCreate
            ? `${leadershipGroupLabel(form.getValues("groupKey"))} — yeni kişi`
            : "Kişiyi düzenle"}
        </h1>
      </div>

      {isPresident && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Başkan kaydı buradan silinemez. Ana sayfa mesajı için{" "}
          <Link className="underline" to="/president-message">
            Başkanın mesajı
          </Link>{" "}
          sayfasını kullanın.
        </p>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        {form.formState.errors.root && (
          <p className="text-sm text-red-600">{form.formState.errors.root.message}</p>
        )}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kişi bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {!isCreate && (
              <div className="space-y-2 md:col-span-2">
                <Label>Rol anahtarı</Label>
                <Input {...form.register("roleKey")} readOnly className="bg-zinc-50" />
              </div>
            )}
            {isCreate && roleKeyPreview && (
              <div className="space-y-2 md:col-span-2">
                <Label>Otomatik rol anahtarı (önizleme)</Label>
                <Input value={roleKeyPreview} readOnly className="bg-zinc-50 font-mono text-sm" />
              </div>
            )}
            <div className="space-y-2">
              <Label>Grup</Label>
              <select
                className="h-10 w-full rounded-md border px-3 text-sm"
                {...form.register("groupKey")}
                disabled={Boolean(groupFromQuery) && isCreate}
              >
                {LEADERSHIP_GROUPS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Sıra</Label>
              <Input type="number" {...form.register("sortOrder")} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Ad soyad</Label>
              <Input {...form.register("name")} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Ünvan</Label>
              <Input {...form.register("title")} />
            </div>
            {(isPresident || isDanisman) && (
              <>
                <div className="space-y-2 md:col-span-2">
                  <Label>Mesaj başlığı (H2)</Label>
                  <Input
                    {...form.register("messageTitle")}
                    placeholder="Ana sayfa başkan bandı başlığı"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Üst satır (ops.)</Label>
                  <Input {...form.register("eyebrow")} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Alıntı / biyografi satırları</Label>
                  <Textarea rows={4} {...form.register("quotesText")} />
                </div>
              </>
            )}
            <div className="flex items-center gap-2 md:col-span-2">
              <input type="checkbox" id="la" {...form.register("isActive")} />
              <Label htmlFor="la">Yayında (sitede görünsün)</Label>
            </div>
            <div className="md:col-span-2">
              <Label>Portre (ops.)</Label>
              <MediaPicker
                value={form.watch("portraitId") ?? null}
                onChange={(mid) => form.setValue("portraitId", mid, { shouldDirty: true })}
                acceptMimePrefix="image/"
              />
            </div>
          </CardContent>
        </Card>
        <div className="flex gap-2">
          <Button type="submit" disabled={saveM.isPending}>
            {isCreate ? "Ekle" : "Kaydet"}
          </Button>
          <Button variant="outline" asChild>
            <Link to={backHref}>İptal</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
