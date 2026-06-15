import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { listMapDistrictsAdmin } from "@/api/mapDistrictsAdmin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MapDistrictsListPage() {
  const listQ = useQuery({
    queryKey: ["map-districts"],
    queryFn: listMapDistrictsAdmin,
  });

  const rows = listQ.data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Bölgesel harita — ilçe verileri</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Harita görseli ve konumlar sabittir. Yalnızca panelde görünen metin ve sayılar düzenlenir.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">İlçeler</CardTitle>
        </CardHeader>
        <CardContent>
          {listQ.isLoading ? (
            <p className="text-sm text-zinc-500">Yükleniyor…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-zinc-500">
                    <th className="pb-2 pr-4">Slug</th>
                    <th className="pb-2 pr-4">Etiket</th>
                    <th className="pb-2 pr-4">Ürün hattı</th>
                    <th className="pb-2 pr-4">Hacim</th>
                    <th className="pb-2 pr-4">Durum</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.slug} className="border-b border-zinc-100">
                      <td className="py-3 pr-4 font-mono text-xs">{row.slug}</td>
                      <td className="py-3 pr-4">{row.label}</td>
                      <td className="py-3 pr-4 max-w-xs truncate">{row.productLine}</td>
                      <td className="py-3 pr-4">{row.dailyVolume}</td>
                      <td className="py-3 pr-4">{row.isActive ? "Aktif" : "Pasif"}</td>
                      <td className="py-3 text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/map-districts/${row.slug}/edit`}>Düzenle</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
