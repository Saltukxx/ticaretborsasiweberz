import { Link } from "react-router-dom";
import PageHero from "../components/PageHero";
import SeoHead from "../components/SeoHead";
import { usePublicLeadership } from "../hooks/usePublicApi";
import type { PublicLeader } from "../lib/publicApi";
import { resolveMediaUrl } from "../lib/resolveMediaUrl";
import "./LeadershipPage.css";

/** Sayfadaki grup sıralaması ve başlıkları */
const GROUPS: {
  key: string;
  heading: string;
  eyebrow: string;
  anchor: string;
}[] = [
  {
    key: "yonetim_kurulu",
    heading: "Yönetim Kurulu",
    eyebrow: "Karar Organı",
    anchor: "yonetim-kurulu",
  },
  {
    key: "meclis",
    heading: "Meclisimiz",
    eyebrow: "Temsil Organı",
    anchor: "meclis",
  },
  {
    key: "tobb_delegeleri",
    heading: "TOBB Genel Kurul Delegeleri",
    eyebrow: "Ulusal Temsil",
    anchor: "tobb-delegeleri",
  },
  {
    key: "personel",
    heading: "Genel Sekreterlik ve Personel",
    eyebrow: "İdari Kadro",
    anchor: "personel",
  },
];

function Portrait({ leader, large }: { leader: PublicLeader; large?: boolean }) {
  const portrait = leader.portraitUrl ? resolveMediaUrl(leader.portraitUrl) : null;
  const cls = `leadership-page__portrait${large ? " leadership-page__portrait--lg" : ""}`;
  if (portrait) {
    return (
      <img className={cls} src={portrait} alt={`${leader.name} portre`} loading="lazy" />
    );
  }
  const initials = leader.name
    .split(/\s+/)
    .filter((p) => !p.endsWith(".") && !p.endsWith("&")) // "Prof.", "Dr.", "Av." gibi unvanları atla
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toLocaleUpperCase("tr-TR");
  return (
    <div className={`${cls} leadership-page__portrait--placeholder`} aria-hidden>
      <span>{initials}</span>
    </div>
  );
}

function PersonCard({ leader }: { leader: PublicLeader }) {
  return (
    <article className="leadership-page__card card">
      <Portrait leader={leader} />
      <div>
        <h3>{leader.name}</h3>
        <p className="mono">{leader.title}</p>
      </div>
    </article>
  );
}

function FeaturedCard({ leader }: { leader: PublicLeader }) {
  return (
    <article className="leadership-page__card leadership-page__card--featured card">
      <Portrait leader={leader} large />
      <div>
        <h3>{leader.name}</h3>
        <p className="mono">{leader.title}</p>
      </div>
    </article>
  );
}

function ConsultantsSection({ leaders }: { leaders: PublicLeader[] }) {
  if (leaders.length === 0) return null;
  const heading = leaders.length > 1 ? "Danışmanlarımız" : "Danışmanımız";

  return (
    <section
      id="danisman"
      className="leadership-page__section leadership-page__consultant-wrap"
    >
      <header className="leadership-page__section-head">
        <span className="mono leadership-page__section-eyebrow">Stratejik Akıl</span>
        <h2>{heading}</h2>
      </header>
      {leaders.map((leader) => (
        <article key={leader.id} className="leadership-page__consultant card">
          <div className="leadership-page__consultant-media">
            <Portrait leader={leader} large />
          </div>
          <div className="leadership-page__consultant-body">
            <span className="mono leadership-page__consultant-tag">Danışman</span>
            <h3>{leader.name}</h3>
            {leader.eyebrow && (
              <p className="mono leadership-page__consultant-org">{leader.eyebrow}</p>
            )}
            <p className="leadership-page__consultant-title">{leader.title}</p>
            {leader.quoteLines && leader.quoteLines.length > 0 && (
              <div className="leadership-page__consultant-bio">
                {leader.quoteLines.map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            )}
          </div>
        </article>
      ))}
    </section>
  );
}

export default function LeadershipPage() {
  const { data: leaders, isLoading, isError } = usePublicLeadership();
  const list = leaders ?? [];

  const byGroup = (key: string) =>
    list.filter((l) => (l.groupKey ?? "yonetim_kurulu") === key);

  const consultants = byGroup("danisman");

  return (
    <>
      <SeoHead
        title="Kurumsal Yapı ve Yönetim"
        description="Erzurum Ticaret Borsası yönetim kurulu, meclis, TOBB delegeleri, genel sekreterlik kadrosu ve danışmanlar."
        path="/kurumsal/yonetim"
      />
      <PageHero
        breadcrumb="Kurumsal"
        eyebrow="Yönetim · Meclis · Kadro"
        title={<>Kurumsal <em>Yapımız</em></>}
        intro="Yönetim kurulundan meclise, genel sekreterlik kadrosundan TOBB delegelerine — borsayı taşıyan ekip."
      />
      <section className="leadership-page">
        <div className="container">
          {isLoading && <p className="leadership-page__state">Yükleniyor…</p>}
          {isError && (
            <p className="leadership-page__state leadership-page__state--error">
              Kurumsal yapı listesi yüklenemedi.
            </p>
          )}
          {!isLoading && !isError && list.length === 0 && (
            <p className="leadership-page__state">Henüz kayıt yok.</p>
          )}

          {!isLoading && !isError && list.length > 0 && (
            <>
              <nav className="leadership-page__toc mono" aria-label="Bölümler">
                {GROUPS.filter((g) => byGroup(g.key).length > 0).map((g) => (
                  <a key={g.key} href={`#${g.anchor}`}>
                    {g.heading}
                  </a>
                ))}
                {consultants.length > 0 && (
                  <a href="#danisman">
                    {consultants.length > 1 ? "Danışmanlarımız" : "Danışmanımız"}
                  </a>
                )}
              </nav>

              {GROUPS.map((group) => {
                const members = byGroup(group.key);
                if (members.length === 0) return null;
                const [head, ...rest] = members;
                return (
                  <section
                    key={group.key}
                    id={group.anchor}
                    className="leadership-page__section"
                  >
                    <header className="leadership-page__section-head">
                      <span className="mono leadership-page__section-eyebrow">
                        {group.eyebrow}
                      </span>
                      <h2>{group.heading}</h2>
                      <span className="mono leadership-page__section-count">
                        {members.length} kişi
                      </span>
                    </header>
                    <FeaturedCard leader={head!} />
                    {rest.length > 0 && (
                      <div className="leadership-page__grid">
                        {rest.map((leader) => (
                          <PersonCard key={leader.id} leader={leader} />
                        ))}
                      </div>
                    )}
                  </section>
                );
              })}

              {consultants.length > 0 && <ConsultantsSection leaders={consultants} />}
            </>
          )}

          <p className="leadership-page__back mono">
            <Link to="/kurumsal">← Kurumsal sayfa</Link>
          </p>
        </div>
      </section>
    </>
  );
}
