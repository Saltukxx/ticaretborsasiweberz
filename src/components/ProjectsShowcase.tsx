import { useMemo, type CSSProperties } from "react";
import { useCountUp, useReveal } from "../hooks/useReveal";
import "./ProjectsShowcase.css";

type ProjectIconName = "digital" | "data" | "lab";

interface ProjectPhase {
  label: string;
  done: boolean;
}

interface OngoingProject {
  title: string;
  field: string;
  summary: string;
  progress: number;
  target: string;
  phase: string;
  phases: ProjectPhase[];
  icon: ProjectIconName;
  outputs: string[];
}

interface CompletedProject {
  title: string;
  field: string;
  summary: string;
  year: string;
  impact: string;
  result: string;
  metric: {
    value: string;
    label: string;
  };
}

const focusAreas = [
  "Dijital Dönüşüm",
  "Piyasa Şeffaflığı",
  "Kalite",
  "Üye Hizmetleri",
  "Kurumsal Kimlik",
  "Analiz",
  "Bölgesel Kalkınma",
];

const impactStats = [
  { value: 6, label: "Dijital hizmet adımı" },
  { value: 12, label: "Standart rapor" },
  { value: 4, label: "Üye temas noktası" },
  { value: 8, label: "Şeffaf veri seti" },
];

const ongoingProjects: OngoingProject[] = [
  {
    title: "Dijital Tescil ve Üye İşlem Altyapısı",
    field: "Dijital Dönüşüm",
    summary:
      "Tescil başvuruları, belge süreçleri ve üye hizmetlerini tek merkezden izlenebilir hale getiren yeni dijital işlem katmanı.",
    progress: 72,
    target: "2026 / 3. Çeyrek",
    phase: "Pilot kullanım",
    icon: "digital",
    phases: [
      { label: "Hazırlık", done: true },
      { label: "Tasarım", done: true },
      { label: "Pilot", done: false },
      { label: "Yayım", done: false },
    ],
    outputs: ["Online başvuru", "Belge takibi", "Üye işlem paneli"],
  },
  {
    title: "Bölgesel Üretici Veri Merkezi",
    field: "Piyasa Şeffaflığı",
    summary:
      "Hububat, bakliyat ve hayvancılık verilerini düzenli toplayan, raporlayan ve karar almayı hızlandıran veri merkezi çalışması.",
    progress: 58,
    target: "2026 / 4. Çeyrek",
    phase: "Veri modeli",
    icon: "data",
    phases: [
      { label: "Hazırlık", done: true },
      { label: "Tasarım", done: false },
      { label: "Pilot", done: false },
      { label: "Yayım", done: false },
    ],
    outputs: ["Ürün endeksleri", "İlçe kırılımları", "Haftalık raporlar"],
  },
  {
    title: "Laboratuvar Modernizasyon Programı",
    field: "Kalite ve Analiz",
    summary:
      "Analiz kapasitesini artıran, randevu ve sonuç paylaşımını hızlandıran yeni nesil laboratuvar hizmet standardı.",
    progress: 41,
    target: "2027 / 1. Çeyrek",
    phase: "Altyapı hazırlığı",
    icon: "lab",
    phases: [
      { label: "Hazırlık", done: false },
      { label: "Tasarım", done: false },
      { label: "Pilot", done: false },
      { label: "Yayım", done: false },
    ],
    outputs: ["Randevu sistemi", "Analiz takibi", "Kalite raporu"],
  },
];

const completedProjects: CompletedProject[] = [
  {
    title: "Fiyat Bülteni Dijitalleşmesi",
    field: "Piyasa Bilgisi",
    summary:
      "Günlük fiyatların daha okunabilir, hızlı ve arşivlenebilir biçimde yayınlanması için dijital bülten altyapısı oluşturuldu.",
    year: "2025",
    impact: "Şeffaf fiyat yayını",
    result: "Günlük fiyat akışı tek merkezde toplandı.",
    metric: { value: "+34%", label: "Bülten erişim düzenliliği" },
  },
  {
    title: "Üye İletişim ve Duyuru Hattı",
    field: "Üye Hizmetleri",
    summary:
      "Duyuru, toplantı ve bilgilendirme süreçleri için üyelerin daha hızlı haberdar olmasını sağlayan iletişim standardı kuruldu.",
    year: "2025",
    impact: "Hızlı bilgilendirme",
    result: "Kurum duyuruları daha görünür hale geldi.",
    metric: { value: "+48%", label: "Üye duyuru görünürlüğü" },
  },
  {
    title: "Kurumsal Web Arayüz Yenilemesi",
    field: "Kurumsal Kimlik",
    summary:
      "Borsanın hizmetleri, piyasa verileri, haberleri ve raporları için modern, erişilebilir ve mobil uyumlu arayüz hazırlandı.",
    year: "2026",
    impact: "Dijital görünürlük",
    result: "Kurumsal içerikler ayrı sayfalarda toplandı.",
    metric: { value: "9", label: "Ayrı kurumsal sayfa" },
  },
  {
    title: "Bölgesel Piyasa Raporlama Seti",
    field: "Analiz",
    summary:
      "Haftalık ve aylık raporlarda ürün hareketleri, piyasa eğilimleri ve bölgesel ticaret göstergeleri standart hale getirildi.",
    year: "2026",
    impact: "Karar desteği",
    result: "Rapor dili ve veri yapısı sadeleştirildi.",
    metric: { value: "12", label: "Standart rapor alanı" },
  },
];

export default function ProjectsShowcase() {
  const overviewRef = useReveal<HTMLDivElement>();
  const ongoingRef = useReveal<HTMLDivElement>();
  const completedRef = useReveal<HTMLDivElement>();
  const impactRef = useReveal<HTMLDivElement>();

  return (
    <section className="projects-showcase">
      <div className="container">
        <div className="projects-showcase__overview reveal" ref={overviewRef}>
          <div>
            <span className="eyebrow">Proje Portföyü</span>
            <h2>
              Kurumsal kapasiteyi ve bölgesel ticareti <em>ölçülebilir projelerle</em> güçlendiriyoruz.
            </h2>
            <div className="projects-showcase__focus" aria-label="Proje odak alanları">
              {focusAreas.map((area, index) => (
                <span key={area} style={{ "--delay": `${index * 0.06}s` } as CSSProperties}>
                  {area}
                </span>
              ))}
            </div>
          </div>
          <div className="projects-showcase__numbers" aria-label="Proje özeti">
            <SummaryNumber value={ongoingProjects.length} label="Devam Eden" />
            <SummaryNumber value={completedProjects.length} label="Tamamlanan" />
            <SummaryNumber value={7} label="Odak Alanı" />
          </div>
        </div>

        <div className="projects-lane reveal" ref={ongoingRef}>
          <div className="projects-lane__head">
            <span className="eyebrow">Devam Eden Projeler</span>
            <h2>Yürürlükteki çalışmalar, hedef tarih ve ilerleme oranıyla izlenir.</h2>
          </div>

          <div className="projects-lane__grid">
            {ongoingProjects.map((project, index) => {
              const activePhase = project.phases.findIndex((phase) => !phase.done);
              const activePhaseIndex = activePhase === -1 ? project.phases.length - 1 : activePhase;

              return (
                <article
                  className="projects-lane__card"
                  key={project.title}
                  style={
                    {
                      "--progress": `${project.progress}%`,
                      "--delay": `${index * 0.08}s`,
                    } as CSSProperties
                  }
                >
                  <div className="projects-lane__top">
                    <ProjectIcon name={project.icon} />
                    <div className="projects-lane__meta mono">
                      <span>{project.field}</span>
                      <strong>{project.phase}</strong>
                    </div>
                  </div>
                  <h3>{project.title}</h3>
                  <p>{project.summary}</p>
                  <ol className="projects-lane__phases" aria-label={`${project.title} proje fazları`}>
                    {project.phases.map((phase, phaseIndex) => (
                      <li
                        className={`${phase.done ? "is-done" : ""} ${phaseIndex === activePhaseIndex ? "is-active" : ""}`}
                        key={phase.label}
                      >
                        <span aria-hidden />
                        <small>{phase.label}</small>
                      </li>
                    ))}
                  </ol>
                  <div className="projects-lane__progress" aria-label={`${project.title} ilerleme oranı yüzde ${project.progress}`}>
                    <span />
                  </div>
                  <div className="projects-lane__foot">
                    <span className="mono">%{project.progress}</span>
                    <strong>Hedef: {project.target}</strong>
                  </div>
                  <ul>
                    {project.outputs.map((output) => (
                      <li key={output}>{output}</li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </div>

        <div className="projects-archive reveal" ref={completedRef}>
          <div className="projects-archive__head">
            <div>
              <span className="eyebrow">Tamamlanan Projeler</span>
              <h2>Tamamlanan çalışmalar kurumsal hafızaya ve hizmet standardına dönüşür.</h2>
            </div>
            <p>
              Bu alan, borsanın tamamlanmış dijitalleşme, raporlama ve üye hizmeti çalışmalarını
              kısa sonuçlarıyla birlikte sergiler.
            </p>
          </div>

          <div className="projects-archive__grid">
            {completedProjects.map((project, index) => (
              <article
                className="projects-archive__card"
                key={project.title}
                style={{ "--delay": `${index * 0.12}s` } as CSSProperties}
              >
                <span className="projects-archive__node" aria-hidden />
                <div className="projects-archive__year-wrap">
                  <span className="projects-archive__year mono">{project.year}</span>
                </div>
                <div className="projects-archive__body">
                  <span className="projects-archive__field mono">{project.field}</span>
                  <div className="projects-archive__title-row">
                    <h3>{project.title}</h3>
                    <span className="projects-archive__stamp mono">{project.year}</span>
                  </div>
                  <p>{project.summary}</p>
                  <div className="projects-archive__result">
                    <div className="projects-archive__metric">
                      <MetricValue value={project.metric.value} />
                      <span>{project.metric.label}</span>
                    </div>
                    <div>
                      <span>{project.impact}</span>
                      <strong>{project.result}</strong>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="projects-impact reveal" ref={impactRef}>
          <div>
            <span className="eyebrow">Etki Haritası</span>
            <h2>Tamamlanan projelerin etkisi kurum hafızasında ölçülebilir iz bırakır.</h2>
          </div>
          <div className="projects-impact__grid" aria-label="Tamamlanan proje etki göstergeleri">
            {impactStats.map((stat, index) => (
              <ImpactStat key={stat.label} value={stat.value} label={stat.label} index={index} />
            ))}
          </div>
          <span className="projects-impact__stamp mono">ETB · Kurumsal Hafıza</span>
        </div>
      </div>
    </section>
  );
}

function SummaryNumber({ value, label }: { value: number; label: string }) {
  const reducedMotion = useReducedMotion();
  const ref = useCountUp(value, 1400, !reducedMotion);

  return (
    <div className="projects-showcase__number">
      <strong className="mono">
        <span ref={ref}>{String(value).padStart(2, "0")}</span>
      </strong>
      <span>{label}</span>
    </div>
  );
}

function ImpactStat({ value, label, index }: { value: number; label: string; index: number }) {
  const reducedMotion = useReducedMotion();
  const ref = useCountUp(value, 1300, !reducedMotion);

  return (
    <div className="projects-impact__stat" style={{ "--delay": `${index * 0.08}s` } as CSSProperties}>
      <strong className="mono">
        <span ref={ref}>{String(value).padStart(2, "0")}</span>
      </strong>
      <span>{label}</span>
    </div>
  );
}

function MetricValue({ value }: { value: string }) {
  const parsed = parseMetric(value);
  const reducedMotion = useReducedMotion();
  const ref = useCountUp(parsed?.target ?? 0, 1200, !reducedMotion);

  if (!parsed) {
    return <strong className="mono">{value}</strong>;
  }

  return (
    <strong className="mono">
      {parsed.prefix}
      <span ref={ref}>{parsed.fallback}</span>
      {parsed.suffix}
    </strong>
  );
}

function parseMetric(value: string) {
  const match = value.match(/^([+-]?)(\d+(?:[.,]\d+)?)(.*)$/);
  if (!match) return null;

  const [, prefix, rawNumber, suffix] = match;
  const normalized = rawNumber.replace(",", ".");

  return {
    prefix,
    target: Number(normalized),
    suffix,
    fallback: rawNumber,
  };
}

function useReducedMotion() {
  return useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );
}

function ProjectIcon({ name }: { name: ProjectIconName }) {
  switch (name) {
    case "digital":
      return (
        <span className="projects-lane__icon" aria-hidden>
          <svg viewBox="0 0 48 48" role="img">
            <path d="M12 15.5h24v15H12z" />
            <path d="M18 36h12" />
            <path d="M24 30.5V36" />
            <path d="M17 21h14" />
            <path d="M17 25h8" />
          </svg>
        </span>
      );
    case "data":
      return (
        <span className="projects-lane__icon" aria-hidden>
          <svg viewBox="0 0 48 48" role="img">
            <path d="M13 32c0 3 5 5 11 5s11-2 11-5" />
            <path d="M13 24c0 3 5 5 11 5s11-2 11-5" />
            <path d="M13 16c0 3 5 5 11 5s11-2 11-5-5-5-11-5-11 2-11 5z" />
            <path d="M13 16v16" />
            <path d="M35 16v16" />
          </svg>
        </span>
      );
    case "lab":
      return (
        <span className="projects-lane__icon" aria-hidden>
          <svg viewBox="0 0 48 48" role="img">
            <path d="M19 10h10" />
            <path d="M21 10v11l-8 12c-1.5 2.3.1 5 2.9 5h16.2c2.8 0 4.4-2.7 2.9-5l-8-12V10" />
            <path d="M18 31h12" />
            <path d="M20 26h8" />
          </svg>
        </span>
      );
    default: {
      const exhaustive: never = name;
      return exhaustive;
    }
  }
}
