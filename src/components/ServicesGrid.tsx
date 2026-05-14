import { services } from "../data/market";
import { useReveal } from "../hooks/useReveal";
import "./ServicesGrid.css";

const Icon = ({ name }: { name: string }) => {
  const props = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none" } as const;
  const stroke = "currentColor";
  switch (name) {
    case "user":
      return (
        <svg {...props}><circle cx="12" cy="8" r="4" stroke={stroke} strokeWidth="1.4" /><path d="M4 21c1-4 4.5-6 8-6s7 2 8 6" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" /></svg>
      );
    case "stamp":
      return (
        <svg {...props}><path d="M8 4l1 4h6l1-4M6 10h12v3a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4v-3zM4 21h16" stroke={stroke} strokeWidth="1.4" strokeLinejoin="round" /></svg>
      );
    case "flask":
      return (
        <svg {...props}><path d="M9 3h6M10 3v6L4 19a2 2 0 0 0 1.7 3h12.6A2 2 0 0 0 20 19l-6-10V3" stroke={stroke} strokeWidth="1.4" strokeLinejoin="round" /></svg>
      );
    case "doc":
      return (
        <svg {...props}><path d="M7 3h8l4 4v14H7z" stroke={stroke} strokeWidth="1.4" strokeLinejoin="round" /><path d="M15 3v4h4M9 12h6M9 16h6" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" /></svg>
      );
    case "spark":
      return (
        <svg {...props}><path d="M12 3l2.4 5.6L20 11l-5.6 2.4L12 19l-2.4-5.6L4 11l5.6-2.4z" stroke={stroke} strokeWidth="1.4" strokeLinejoin="round" /></svg>
      );
    case "book":
      return (
        <svg {...props}><path d="M5 4h10a4 4 0 0 1 4 4v12H9a4 4 0 0 1-4-4V4z" stroke={stroke} strokeWidth="1.4" strokeLinejoin="round" /><path d="M5 16h14" stroke={stroke} strokeWidth="1.4" /></svg>
      );
    case "megaphone":
      return (
        <svg {...props}><path d="M3 11v2l14 5V6L3 11zM17 9v6M7 13h2v6H7z" stroke={stroke} strokeWidth="1.4" strokeLinejoin="round" /></svg>
      );
    case "gavel":
      return (
        <svg {...props}><path d="M14 4l6 6-3 3-6-6 3-3zM10 8l6 6-7 7H3v-6l7-7zM12 20h10" stroke={stroke} strokeWidth="1.4" strokeLinejoin="round" /></svg>
      );
    default:
      return null;
  }
};

export default function ServicesGrid() {
  const ref = useReveal<HTMLDivElement>();
  return (
    <section className="services">
      <div className="container">
        <div className="section-title reveal" ref={useReveal<HTMLDivElement>()}>
          <div>
            <span className="eyebrow">Kurumsal Portal · Üye Hizmetleri</span>
            <h2>
              Kurumsal <em className="services__em">Hizmetler</em>
            </h2>
          </div>
          <p>
            Üyelerimize ve bölge ticaretine yönelik hizmetlere hızlı erişim.
            Dijital ve fiziksel hizmet kanallarımız tek panelde.
          </p>
        </div>

        <div className="services__grid reveal-stagger" ref={ref}>
          {services.map((s, i) => (
            <article className="service card" key={s.id}>
              <span className="service__num mono">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="service__icon" aria-hidden>
                <Icon name={s.icon} />
              </div>
              <h3 className="service__title">{s.title}</h3>
              <p className="service__desc">{s.desc}</p>
              <span className="service__cta mono">
                Hizmete Git <span>→</span>
              </span>
              <span className="service__corner" aria-hidden />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
