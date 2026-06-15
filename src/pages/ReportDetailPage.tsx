import { Suspense, lazy, useEffect } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import PageHero from "../components/PageHero";
import SeoHead from "../components/SeoHead";

const PdfViewer = lazy(() => import("../components/PdfViewer"));
import { usePublicReport } from "../hooks/usePublicApi";
import { ApiError, reportDownloadUrl } from "../lib/publicApi";
import "./ReportDetailPage.css";

export default function ReportDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { data: report, isLoading, error } = usePublicReport(slug);

  useEffect(() => {
    if (!slug || searchParams.get("dl") !== "1") return;
    window.location.assign(reportDownloadUrl(slug));
    navigate(`/raporlar/${slug}`, { replace: true });
  }, [searchParams, slug, navigate]);

  const dateLabel =
    report?.periodLabel ??
    (report?.reportDate
      ? new Date(report.reportDate).toLocaleDateString("tr-TR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : null);

  const err404 = error instanceof ApiError && error.status === 404;
  const path = slug ? `/raporlar/${slug}` : "/raporlar";

  return (
    <>
      <SeoHead
        title={report?.name ?? (err404 ? "Rapor bulunamadı" : "Rapor")}
        description={
          report?.summary ??
          "Erzurum Ticaret Borsası dönemsel rapor özeti ve PDF indirme."
        }
        path={path}
        noindex={err404}
        type="article"
        article={
          report
            ? {
                path,
                datePublished: report.reportDate,
              }
            : undefined
        }
      />
      <PageHero
        breadcrumb="Raporlar"
        eyebrow={report?.type ?? "Rapor"}
        title={report?.name ?? (err404 ? "Rapor bulunamadı" : "Rapor")}
        intro={
          err404
            ? "Bu adrese karşılık gelen yayında bir rapor yok veya erişime kapalı olabilir."
            : report?.summary ??
              "Özet ve ekli PDF dosyasına buradan ulaşabilirsiniz."
        }
      />

      <section className="report-detail">
        <div className="container report-detail__inner">
          <nav className="report-detail__back mono">
            <Link to="/raporlar">← Tüm raporlar</Link>
          </nav>

          {isLoading && <p className="report-detail__state">Rapor yükleniyor…</p>}

          {!isLoading && error && (
            <p className="report-detail__state report-detail__state--error">
              {err404
                ? "Rapor bulunamadı."
                : "Rapor yüklenirken bir sorun oluştu. Lütfen daha sonra tekrar deneyin."}
            </p>
          )}

          {!isLoading && report && (
            <article className="report-detail__article card">
              <header className="report-detail__head">
                {report.type && <span className="mono report-detail__type">{report.type}</span>}
                {dateLabel && <span className="mono report-detail__date">{dateLabel}</span>}
              </header>
              {report.summary && <p className="report-detail__summary">{report.summary}</p>}
              <div className="report-detail__actions">
                <a
                  className="btn btn-primary"
                  href={reportDownloadUrl(report.slug)}
                >
                  PDF İndir
                </a>
                <a
                  className="btn btn-ghost"
                  href={reportDownloadUrl(report.slug, true)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Tarayıcıda aç
                </a>
              </div>
            </article>
          )}

          {!isLoading && report && (
            <div className="report-detail__viewer">
              <Suspense
                fallback={<p className="report-detail__state">Görüntüleyici yükleniyor…</p>}
              >
                <PdfViewer
                  src={reportDownloadUrl(report.slug, true)}
                  downloadUrl={reportDownloadUrl(report.slug)}
                  title={report.name}
                />
              </Suspense>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
