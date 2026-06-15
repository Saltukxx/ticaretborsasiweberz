import { useQueries } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { listNewsAdmin } from "@/api/newsAdmin";
import { listPriceEntriesAdmin } from "@/api/pricesAdmin";
import { listCurrencyRatesAdmin } from "@/api/currencyAdmin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function DashboardPage() {
  const [newsQ, pricesQ, fxQ] = useQueries({
    queries: [
      {
        queryKey: ["dashboard", "news"],
        queryFn: () => listNewsAdmin({ limit: 5, offset: 0, scope: "active", q: undefined }),
      },
      {
        queryKey: ["dashboard", "prices"],
        queryFn: () =>
          listPriceEntriesAdmin({
            limit: 8,
            offset: 0,
          }),
      },
      {
        queryKey: ["dashboard", "fx"],
        queryFn: () => listCurrencyRatesAdmin({ limit: 8, offset: 0 }),
      },
    ],
  });

  const news = newsQ.data?.data ?? [];
  const prices = pricesQ.data?.data ?? [];
  const fx = fxQ.data?.data ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Panel</h1>
        <p className="text-sm text-zinc-600">
          Son haberler, fiyat kayıtları ve döviz kurlarına hızlı bağlantılar.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Haberler</CardTitle>
            <Link to="/news" className="text-xs font-medium text-zinc-600 hover:text-zinc-900">
              Tümü
            </Link>
          </CardHeader>
          <CardContent>
            {newsQ.isLoading ? (
              <p className="text-sm text-zinc-500">Yükleniyor…</p>
            ) : news.length === 0 ? (
              <p className="text-sm text-zinc-500">Kayıt yok</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {news.map((n) => (
                  <li key={n.id} className="flex justify-between gap-2">
                    <Link
                      to={`/news/${n.id}/edit`}
                      className="truncate font-medium text-zinc-800 hover:underline"
                    >
                      {n.title}
                    </Link>
                    <span className="shrink-0 text-xs text-zinc-500">
                      {n.publishedAt ? "yayında" : "taslak"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Son fiyat kayıtları</CardTitle>
            <Link
              to="/prices"
              className="text-xs font-medium text-zinc-600 hover:text-zinc-900"
            >
              Fiyatlar
            </Link>
          </CardHeader>
          <CardContent>
            {pricesQ.isLoading ? (
              <p className="text-sm text-zinc-500">Yükleniyor…</p>
            ) : prices.length === 0 ? (
              <p className="text-sm text-zinc-500">Kayıt yok</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {prices.map((p) => (
                  <li
                    key={p.id}
                    className="flex justify-between gap-2 text-zinc-700"
                  >
                    <span className="truncate font-mono text-xs">{p.entryDate}</span>
                    <span className="shrink-0 text-xs">
                      Ort. {p.avgPrice}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Döviz kurları</CardTitle>
            <Link
              to="/currency-rates"
              className="text-xs font-medium text-zinc-600 hover:text-zinc-900"
            >
              Liste
            </Link>
          </CardHeader>
          <CardDescription className="px-6 pb-2 text-xs">
            Son eklenen anlık kayıtlar
          </CardDescription>
          <CardContent>
            {fxQ.isLoading ? (
              <p className="text-sm text-zinc-500">Yükleniyor…</p>
            ) : fx.length === 0 ? (
              <p className="text-sm text-zinc-500">Kayıt yok</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {fx.map((r) => (
                  <li key={r.id} className="flex justify-between gap-2">
                    <span className="font-medium text-zinc-800">{r.code}</span>
                    <span className="font-mono text-xs">{r.rateValue}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
