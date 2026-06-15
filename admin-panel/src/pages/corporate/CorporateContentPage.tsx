import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  createMilestoneAdmin,
  deleteMilestoneAdmin,
  getCorporateProfileAdmin,
  listCorporateMilestonesAdmin,
  patchCorporateProfileAdmin,
  patchMilestoneAdmin,
  type CorporateMilestone,
} from "@/api/corporateAdmin";
import { getSiteContactAdmin, patchSiteContactAdmin } from "@/api/siteAdmin";
import { ApiError } from "@/api/http";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const profileSchema = z.object({
  eyebrow: z.string(),
  heading: z.string().min(1),
  lead: z.string(),
  mission: z.string(),
  vision: z.string(),
});

type ProfileForm = z.infer<typeof profileSchema>;

const milestoneSchema = z.object({
  year: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  sortOrder: z.coerce.number().int().min(0),
});

type MilestoneForm = z.infer<typeof milestoneSchema>;

const contactSchema = z.object({
  address: z.string(),
  phone: z.string(),
  fax: z.string(),
  emailPrimary: z.string(),
  emailSecondary: z.string(),
  hours: z.string(),
  socialLinkedin: z.string(),
  socialX: z.string(),
  socialYoutube: z.string(),
  socialInstagram: z.string(),
});

type ContactForm = z.infer<typeof contactSchema>;

export function CorporateContentPage() {
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);

  const profileQ = useQuery({
    queryKey: ["corporate", "profile"],
    queryFn: getCorporateProfileAdmin,
  });

  const milestonesQ = useQuery({
    queryKey: ["corporate", "milestones"],
    queryFn: listCorporateMilestonesAdmin,
  });

  const contactQ = useQuery({
    queryKey: ["site", "contact"],
    queryFn: getSiteContactAdmin,
  });

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { eyebrow: "", heading: "", lead: "", mission: "", vision: "" },
  });

  const milestoneForm = useForm<MilestoneForm>({
    resolver: zodResolver(milestoneSchema),
    defaultValues: { year: "", title: "", description: "", sortOrder: 0 },
  });

  const contactForm = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      address: "",
      phone: "",
      fax: "",
      emailPrimary: "",
      emailSecondary: "",
      hours: "",
      socialLinkedin: "",
      socialX: "",
      socialYoutube: "",
      socialInstagram: "",
    },
  });

  useEffect(() => {
    if (!profileQ.data?.data) return;
    profileForm.reset(profileQ.data.data);
  }, [profileQ.data, profileForm]);

  useEffect(() => {
    if (!contactQ.data?.data) return;
    const c = contactQ.data.data;
    contactForm.reset({
      address: c.address ?? "",
      phone: c.phone ?? "",
      fax: c.fax ?? "",
      emailPrimary: c.emailPrimary ?? "",
      emailSecondary: c.emailSecondary ?? "",
      hours: c.hours ?? "",
      socialLinkedin: c.socialLinkedin ?? "",
      socialX: c.socialX ?? "",
      socialYoutube: c.socialYoutube ?? "",
      socialInstagram: c.socialInstagram ?? "",
    });
  }, [contactQ.data, contactForm]);

  const saveProfileM = useMutation({
    mutationFn: (vals: ProfileForm) => patchCorporateProfileAdmin(vals),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["corporate"] }),
  });

  const saveContactM = useMutation({
    mutationFn: (vals: ContactForm) => patchSiteContactAdmin(vals),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["site", "contact"] }),
  });

  const saveMilestoneM = useMutation({
    mutationFn: async (vals: MilestoneForm) => {
      if (editingId) {
        return patchMilestoneAdmin(editingId, vals);
      }
      return createMilestoneAdmin(vals);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["corporate", "milestones"] });
      setEditingId(null);
      milestoneForm.reset({ year: "", title: "", description: "", sortOrder: 0 });
    },
  });

  const deleteMilestoneM = useMutation({
    mutationFn: deleteMilestoneAdmin,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["corporate", "milestones"] }),
  });

  const startEdit = (m: CorporateMilestone) => {
    setEditingId(m.id);
    milestoneForm.reset({
      year: m.year,
      title: m.title,
      description: m.description,
      sortOrder: m.sortOrder,
    });
  };

  const milestones = milestonesQ.data?.data ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <h1 className="text-2xl font-semibold">Kurumsal içerik</h1>

      <form
        onSubmit={profileForm.handleSubmit(async (vals) => {
          try {
            await saveProfileM.mutateAsync(vals);
          } catch (e) {
            profileForm.setError("root", {
              message: e instanceof ApiError ? e.message : "Hata",
            });
          }
        })}
        className="space-y-4"
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kurumsal metinler</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {profileForm.formState.errors.root && (
              <p className="text-sm text-red-600">{profileForm.formState.errors.root.message}</p>
            )}
            <div className="space-y-2">
              <Label>Üst başlık (eyebrow)</Label>
              <Input {...profileForm.register("eyebrow")} />
            </div>
            <div className="space-y-2">
              <Label>Ana başlık</Label>
              <Input {...profileForm.register("heading")} />
            </div>
            <div className="space-y-2">
              <Label>Giriş paragrafı</Label>
              <Textarea rows={3} {...profileForm.register("lead")} />
            </div>
            <div className="space-y-2">
              <Label>Misyon</Label>
              <Textarea rows={3} {...profileForm.register("mission")} />
            </div>
            <div className="space-y-2">
              <Label>Vizyon</Label>
              <Textarea rows={3} {...profileForm.register("vision")} />
            </div>
            <Button type="submit" disabled={saveProfileM.isPending}>
              Profili kaydet
            </Button>
          </CardContent>
        </Card>
      </form>

      <form
        onSubmit={contactForm.handleSubmit(async (vals) => {
          try {
            await saveContactM.mutateAsync(vals);
          } catch (e) {
            contactForm.setError("root", {
              message: e instanceof ApiError ? e.message : "Hata",
            });
          }
        })}
        className="space-y-4"
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">İletişim bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {contactForm.formState.errors.root && (
              <p className="text-sm text-red-600">{contactForm.formState.errors.root.message}</p>
            )}
            <div className="space-y-2">
              <Label>Adres</Label>
              <Textarea rows={3} {...contactForm.register("address")} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input {...contactForm.register("phone")} />
              </div>
              <div className="space-y-2">
                <Label>Faks</Label>
                <Input {...contactForm.register("fax")} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>E-posta (genel)</Label>
                <Input {...contactForm.register("emailPrimary")} />
              </div>
              <div className="space-y-2">
                <Label>E-posta (üyelik)</Label>
                <Input {...contactForm.register("emailSecondary")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Çalışma saatleri</Label>
              <Textarea rows={2} {...contactForm.register("hours")} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>LinkedIn URL</Label>
                <Input {...contactForm.register("socialLinkedin")} />
              </div>
              <div className="space-y-2">
                <Label>X (Twitter) URL</Label>
                <Input {...contactForm.register("socialX")} />
              </div>
              <div className="space-y-2">
                <Label>YouTube URL</Label>
                <Input {...contactForm.register("socialYoutube")} />
              </div>
              <div className="space-y-2">
                <Label>Instagram URL</Label>
                <Input {...contactForm.register("socialInstagram")} />
              </div>
            </div>
            <Button type="submit" disabled={saveContactM.isPending}>
              İletişim bilgilerini kaydet
            </Button>
          </CardContent>
        </Card>
      </form>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Kilometre taşları</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingId(null);
              milestoneForm.reset({ year: "", title: "", description: "", sortOrder: 0 });
            }}
          >
            Yeni ekle
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <form
            onSubmit={milestoneForm.handleSubmit(async (vals) => {
              try {
                await saveMilestoneM.mutateAsync(vals);
              } catch (e) {
                milestoneForm.setError("root", {
                  message: e instanceof ApiError ? e.message : "Hata",
                });
              }
            })}
            className="grid gap-3 rounded-lg border p-4"
          >
            <p className="text-sm font-medium">{editingId ? "Düzenle" : "Yeni kilometre taşı"}</p>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Yıl</Label>
                <Input {...milestoneForm.register("year")} />
              </div>
              <div className="space-y-2">
                <Label>Sıra</Label>
                <Input type="number" min={0} {...milestoneForm.register("sortOrder")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Başlık</Label>
              <Input {...milestoneForm.register("title")} />
            </div>
            <div className="space-y-2">
              <Label>Açıklama</Label>
              <Textarea rows={2} {...milestoneForm.register("description")} />
            </div>
            <Button type="submit" size="sm" disabled={saveMilestoneM.isPending}>
              {editingId ? "Güncelle" : "Ekle"}
            </Button>
          </form>

          <ul className="space-y-2">
            {milestones.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-start justify-between gap-2 rounded-md border p-3 text-sm"
              >
                <div>
                  <span className="font-mono text-zinc-500">{m.year}</span>
                  <strong className="ml-2">{m.title}</strong>
                  <p className="mt-1 text-zinc-600">{m.description}</p>
                </div>
                <div className="flex gap-1">
                  <Button type="button" size="sm" variant="outline" onClick={() => startEdit(m)}>
                    Düzenle
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-red-700"
                    onClick={() => deleteMilestoneM.mutate(m.id)}
                  >
                    Sil
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}



