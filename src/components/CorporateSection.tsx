import { useReveal } from "../hooks/useReveal";
import "./CorporateSection.css";

const milestones = [
  { y: "1946", t: "Kuruluş", d: "Erzurum Ticaret Borsası, bölgesel ticaretin kurumsal omurgası olarak kuruldu." },
  { y: "1978", t: "Hububat Tescil Merkezi", d: "Bölgenin hububat tescili ve fiyat şeffaflığı için merkez konuma yükseldi." },
  { y: "1996", t: "Akreditasyon", d: "TOBB nezdinde akredite oda/borsa statüsü kazanıldı." },
  { y: "2014", t: "Elektronik Tescil", d: "Tescil ve üye işlemleri tam dijital altyapıya taşındı." },
  { y: "2026", t: "Dijital Borsa Platformu", d: "Modern fiyat bülteni, canlı veri akışı ve kurumsal dijital portal yayında." },
];

export default function CorporateSection() {
  const ref = useReveal<HTMLDivElement>();
  return (
    <section className="corp">
      <div className="container">
        <div className="corp__grid">
          <div className="corp__copy reveal" ref={useReveal<HTMLDivElement>()}>
            <span className="eyebrow">Kurumsal · 1946'dan Beri</span>
            <h2>
              Erzurum <em className="corp__em">Ticaret Borsası</em>
            </h2>
            <p className="corp__lead">
              Bölgemizin üretim, ticaret ve piyasa yapısına güvenilir kurumsal
              altyapı sunuyoruz. Tarımdan veriye, gelenekten dijitale uzanan
              80 yılı aşkın kurumsal birikimle hizmet veriyoruz.
            </p>

            <div className="corp__mv">
              <div className="corp__mv-card">
                <span className="mono">Misyon</span>
                <p>
                  Üretici, tüccar ve sanayiciye şeffaf piyasa verisi ve kurumsal
                  hizmet üreterek bölgesel ticarete istikrar kazandırmak.
                </p>
              </div>
              <div className="corp__mv-card">
                <span className="mono">Vizyon</span>
                <p>
                  Doğu Anadolu'nun dijitalleşen, veri odaklı ve uluslararası
                  standartlara uyumlu ticaret merkezi olmak.
                </p>
              </div>
            </div>

            <div className="corp__cta">
              <a className="btn btn-primary" href="/kurumsal">Kurumsal Tarihçeyi İncele</a>
              <a className="btn-link" href="/iletisim">Bize Ulaşın</a>
            </div>
          </div>

          <aside className="corp__time reveal-stagger" ref={ref}>
            <div className="corp__time-rail" aria-hidden />
            {milestones.map((m, i) => (
              <div className="corp__time-row" key={m.y}>
                <span className="corp__time-year mono">{m.y}</span>
                <span className="corp__time-dot" />
                <div className="corp__time-body">
                  <h4>{m.t}</h4>
                  <p>{m.d}</p>
                </div>
                <span className="corp__time-num mono">{String(i + 1).padStart(2, "0")}</span>
              </div>
            ))}
          </aside>
        </div>
      </div>
    </section>
  );
}
