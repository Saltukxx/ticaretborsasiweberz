import { Link } from "react-router-dom";
import { usePublicReports } from "../hooks/usePublicApi";
import { reportDownloadUrl } from "../lib/publicApi";
import Sparkline from "./Sparkline";
import { useReveal } from "../hooks/useReveal";
import "./ReportCards.css";

const tones = [
  { color: "#258a4a", fill: "rgba(47,165,90,0.16)", series: [3, 5, 4, 6, 7, 6.5, 8, 9, 8.5, 10] },
  { color: "#7fdca0", fill: "rgba(127,220,160,0.18)", series: [4, 3.5, 5, 4.8, 6, 5.6, 6.8, 7.2, 7, 7.5] },
  { color: "#60a5fa", fill: "rgba(96,165,250,0.18)", series: [5, 6, 5.5, 7, 6.8, 8, 7.6, 8.4, 8.8, 9.2] },
  { color: "#ef6b6b", fill: "rgba(239,107,107,0.16)", series: [6, 5.8, 6.6, 6.2, 7, 6.8, 7.4, 7.6, 7.2, 7.8] },
  { color: "#1a3a86", fill: "rgba(26,58,134,0.12)", series: [2, 3, 3.5, 4.2, 5, 5.6, 6.4, 6.8, 7.2, 7.6] },
];

export default function ReportCards() {
  const ref = useReveal<HTMLDivElement>();
  const { data: reportsData, isLoading, isError } = usePublicReports();
  const reports = reportsData ?? [];
  return (
    <section className="reports">
      <div className="container">
        <div className="section-title reveal" ref={useReveal<HTMLDivElement>()}>
          <div>
            <span className="eyebrow">Raporlar · Veri · Analiz</span>
            <h2>
              Raporlar ve <em className="reports__em">Piyasa Analizleri</em>
            </h2>
          </div>
          <p>
            Günlük, haftalık ve aylık piyasa değerlendirmelerine hızlı erişim sağlayın.
            Tüm raporlar PDF olarak indirilebilir.
          </p>
        </div>

        <div className="reports__grid reveal-stagger" ref={ref}>
          {isLoading && <p className="reports__state">Raporlar yükleniyor…</p>}
          {!isLoading && isError && (
            <p className="reports__state reports__state--error">
              Raporlar yüklenemedi. Lütfen daha sonra tekrar deneyin.
            </p>
          )}
          {!isLoading && !isError && reports.length === 0 && (
            <p className="reports__state">
              Henüz yayınlanmış rapor yok. Yeni PDF raporlar admin panelinden eklenebilir.
            </p>
          )}
          {reports.map((r, i) => {
            const t = tones[i % tones.length];
            const dateLabel = r.periodLabel
              ?? (r.reportDate ? new Date(r.reportDate).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }) : "");
            return (
              <article className="report card" key={r.id}>
                <div className="report__head">
                  <span className="report__type mono">{r.type}</span>
                  <span className="report__date mono">{dateLabel}</span>
                </div>
                <h3 className="report__name">{r.name}</h3>
                <p className="report__sum">{r.summary}</p>

                <div className="report__chart">
                  <Sparkline
                    data={t.series}
                    width={300}
                    height={70}
                    color={t.color}
                    fillColor={t.fill}
                    strokeWidth={1.6}
                  />
                </div>

                <div className="report__foot">
                  <span className="mono">PDF</span>
                  <div className="report__actions">
                    <Link className="btn-link" to={`/raporlar/${r.slug}`}>Raporu İncele</Link>
                    <a className="btn btn-ghost report__dl" href={reportDownloadUrl(r.slug)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="M12 4v12m0 0l-5-5m5 5l5-5M5 20h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      PDF İndir
                    </a>
                  </div>
                </div>

                <div className="report__sheen" aria-hidden />
              </article>
            );
          })}
        </div>

        <div className="reports__all">
          <Link className="btn btn-primary" to="/raporlar">Tüm Raporlar</Link>
        </div>
      </div>
    </section>
  );
}
