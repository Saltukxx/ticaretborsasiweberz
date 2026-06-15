import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listDatabankSyncRuns, triggerDatabankSync } from "@/api/databankAdmin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DatabankSyncPage() {
  const qc = useQueryClient();
  const runsQ = useQuery({
    queryKey: ["databank-sync-runs"],
    queryFn: listDatabankSyncRuns,
  });

  const triggerM = useMutation({
    mutationFn: (dryRun: boolean) =>
      triggerDatabankSync({
        sections: ["home", "tescil"],
        dryRun,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["databank-sync-runs"] });
    },
  });

  const runs = runsQ.data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">DataBank senkron</h1>
        <p className="mt-1 text-sm text-zinc-600">
          borsa.erzurumtb.org.tr/web/data sitesinden fiyat verisi çeker (API yok).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manuel çalıştır</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            disabled={triggerM.isPending}
            onClick={() => triggerM.mutate(false)}
          >
            {triggerM.isPending ? "Çalışıyor…" : "Senkronu başlat (home + tescil)"}
          </Button>
          <Button
            variant="outline"
            disabled={triggerM.isPending}
            onClick={() => triggerM.mutate(true)}
          >
            Kuru çalıştır (dry-run)
          </Button>
          {triggerM.data?.data && (
            <p className="w-full text-sm text-zinc-700">
              Sonuç: {triggerM.data.data.status} — {triggerM.data.data.rowsUpserted}{" "}
              satır, {triggerM.data.data.groupsProcessed} grup
              {triggerM.data.data.errorMessage
                ? ` — Hata: ${triggerM.data.data.errorMessage}`
                : ""}
            </p>
          )}
          {triggerM.isError && (
            <p className="w-full text-sm text-red-600">
              {(triggerM.error as Error).message}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Son koşular</CardTitle>
        </CardHeader>
        <CardContent>
          {runsQ.isLoading && <p className="text-sm text-zinc-500">Yükleniyor…</p>}
          {runs.length === 0 && !runsQ.isLoading && (
            <p className="text-sm text-zinc-500">Henüz kayıt yok.</p>
          )}
          <ul className="space-y-2 text-sm">
            {runs.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded border border-zinc-200 px-3 py-2"
              >
                <span>
                  <strong>{r.status}</strong> — {r.sections.join(", ")}
                </span>
                <span className="text-zinc-500">
                  {new Date(r.startedAt).toLocaleString("tr-TR")}
                  {r.rowsUpserted != null ? ` · ${r.rowsUpserted} satır` : ""}
                </span>
                {r.errorMessage && (
                  <span className="w-full text-red-600">{r.errorMessage}</span>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
