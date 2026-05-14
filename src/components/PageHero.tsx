import "./PageHero.css";

interface Props {
  eyebrow: string;
  title: React.ReactNode;
  intro?: string;
  breadcrumb?: string;
}

export default function PageHero({ eyebrow, title, intro, breadcrumb }: Props) {
  return (
    <section className="phero">
      <div className="phero__bg" aria-hidden>
        <svg viewBox="0 0 1600 500" preserveAspectRatio="none" className="phero__svg">
          <defs>
            <pattern id="pgrid" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M80 0H0V80" fill="none" stroke="rgba(11,21,48,0.055)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pgrid)" />
          <path d="M0,360 C200,320 400,400 600,360 S1000,320 1200,360 1400,400 1600,360"
            stroke="rgba(37,138,74,0.34)" strokeWidth="1" fill="none"
            className="phero__line" />
          <path d="M0,420 C220,460 420,380 620,420 S980,460 1180,420 1420,380 1600,420"
            stroke="rgba(96,165,250,0.35)" strokeWidth="1" fill="none"
            className="phero__line phero__line--2" />
        </svg>
        <div className="phero__orb" />
      </div>
      <div className="container phero__inner">
        {breadcrumb && (
          <span className="phero__crumb mono">Anasayfa · {breadcrumb}</span>
        )}
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="phero__title">{title}</h1>
        {intro && <p className="phero__intro">{intro}</p>}
      </div>
    </section>
  );
}
