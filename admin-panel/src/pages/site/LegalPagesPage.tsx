import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { listLegalPagesAdmin, patchLegalPageAdmin, type LegalPage } from "@/api/siteAdmin";
import { ApiError } from "@/api/http";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SLUG_LABELS: Record<string, string> = {
  kvkk: "KVKK Aydınlatma",
  gizlilik: "Gizlilik",
  cerez: "Çerez",
  erisilebilirlik: "Erişilebilirlik",
};

function LegalPageEditor({ page }: { page: LegalPage }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState(page.title);
  const [body, setBody] = useState(page.body);
  const [isPublished, setIsPublished] = useState(page.isPublished);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(page.title);
    setBody(page.body);
    setIsPublished(page.isPublished);
  }, [page]);

  const saveM = useMutation({
    mutationFn: () =>
      patchLegalPageAdmin(page.slug, { title, body, isPublished }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["legal-pages"] }),
  });

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="space-y-2">
        <Label>Başlık</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>İçerik</Label>
        <RichTextEditor value={body} onChange={setBody} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
        />
        Yayında (yayınlanmamış sayfalar ziyaretçiye gösterilmez)
      </label>
      <Button
        type="button"
        disabled={saveM.isPending}
        onClick={async () => {
          setError(null);
          try {
            await saveM.mutateAsync();
          } catch (e) {
            setError(e instanceof ApiError ? e.message : "Kaydedilemedi");
          }
        }}
      >
        Kaydet
      </Button>
    </div>
  );
}

export function LegalPagesPage() {
  const pagesQ = useQuery({
    queryKey: ["legal-pages"],
    queryFn: listLegalPagesAdmin,
  });

  const pages = pagesQ.data?.data ?? [];
  const defaultSlug = pages[0]?.slug ?? "kvkk";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-semibold">Yasal sayfalar</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">KVKK, gizlilik ve politika metinleri</CardTitle>
        </CardHeader>
        <CardContent>
          {pagesQ.isLoading && <p className="text-sm text-zinc-500">Yükleniyor…</p>}
          {pages.length > 0 && (
            <Tabs defaultValue={defaultSlug}>
              <TabsList className="mb-4 flex flex-wrap h-auto">
                {pages.map((p) => (
                  <TabsTrigger key={p.slug} value={p.slug}>
                    {SLUG_LABELS[p.slug] ?? p.slug}
                  </TabsTrigger>
                ))}
              </TabsList>
              {pages.map((p) => (
                <TabsContent key={p.slug} value={p.slug}>
                  <LegalPageEditor page={p} />
                </TabsContent>
              ))}
            </Tabs>
          )}
          {!pagesQ.isLoading && pages.length === 0 && (
            <p className="text-sm text-zinc-600">
              Henüz yasal sayfa yok. Sunucuda{" "}
              <code className="text-xs">seedLegalPages.js</code> çalıştırın.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
