import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  CORPORATE_DOC_CATEGORY_LABELS,
  listCorporateDocumentsAdmin,
  type CorporateDocumentRow,
} from "@/api/corporateDocsAdmin";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CATEGORY_ORDER = ["tarihce", "organizasyon", "plan", "politika"];

function groupByCategory(docs: CorporateDocumentRow[]) {
  const map = new Map<string, CorporateDocumentRow[]>();
  for (const doc of docs) {
    const list = map.get(doc.category) ?? [];
    list.push(doc);
    map.set(doc.category, list);
  }
  return CATEGORY_ORDER.filter((c) => map.has(c)).map((c) => ({
    category: c,
    label: CORPORATE_DOC_CATEGORY_LABELS[c] ?? c,
    docs: (map.get(c) ?? []).sort((a, b) => a.sortOrder - b.sortOrder),
  }));
}

export function CorporateDocumentsPage() {
  const listQ = useQuery({
    queryKey: ["corporate", "documents"],
    queryFn: listCorporateDocumentsAdmin,
  });

  const groups = groupByCategory(listQ.data?.data ?? []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Kurumsal belgeler</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Tarihçe, politikalar ve diğer kurumsal içerik sayfalarını düzenleyin. PDF
          indirme bağlantıları korunur.
        </p>
      </div>

      {listQ.isLoading && <p className="text-sm text-zinc-500">Yükleniyor…</p>}
      {listQ.isError && (
        <p className="text-sm text-red-600">Belgeler yüklenemedi.</p>
      )}

      {groups.map((group) => (
        <Card key={group.category}>
          <CardHeader>
            <CardTitle className="text-base">{group.label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {group.docs.map((doc) => (
              <div
                key={doc.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-zinc-200 px-3 py-2"
              >
                <div className="min-w-0">
                  <Link
                    className="font-medium hover:underline"
                    to={`/corporate-documents/${doc.id}/edit`}
                  >
                    {doc.title}
                  </Link>
                  <p className="text-xs text-zinc-500 mono">/{doc.slug}</p>
                </div>
                <div className="flex items-center gap-2">
                  {doc.body?.trim() ? (
                    <Badge variant="secondary">içerik var</Badge>
                  ) : (
                    <Badge variant="outline">içerik yok</Badge>
                  )}
                  {doc.isPublished ? (
                    <Badge className="bg-emerald-600">yayında</Badge>
                  ) : (
                    <Badge variant="outline">gizli</Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
