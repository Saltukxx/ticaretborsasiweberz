import { Link } from "react-router-dom";
import { presidentMessage } from "../data/leadership";
import { usePublicPresident } from "../hooks/usePublicApi";
import { resolveMediaUrl } from "../lib/resolveMediaUrl";
import { resolveQuoteLines } from "../lib/resolveQuoteLines";
import { useReveal } from "../hooks/useReveal";
import "./HomePresidentBand.css";

export default function HomePresidentBand() {
  const visualRef = useReveal<HTMLDivElement>();
  const contentRef = useReveal<HTMLElement>();

  const { data: leader } = usePublicPresident();

  const eyebrow = leader?.eyebrow ?? presidentMessage.eyebrow;
  const messageTitle = leader?.messageTitle ?? presidentMessage.title;
  const quote = resolveQuoteLines(leader?.quoteLines, presidentMessage.quote);
  const name = leader?.name ?? presidentMessage.name;
  const role = leader?.title ?? presidentMessage.role;
  const portraitSrc = leader?.portraitUrl
    ? resolveMediaUrl(leader.portraitUrl)
    : presidentMessage.portraitSrc;
  const portraitAlt = `${name} - ${role}`;

  return (
    <section className="president-band" aria-labelledby="president-band-title">
      <div className="container">
        <div className="president-band__shell">
          <div className="president-band__visual reveal" ref={visualRef}>
            <div className="president-band__silhouettes" aria-hidden="true">
              <svg viewBox="0 0 420 300" role="presentation" focusable="false">
                <path
                  d="M76 218c-18-31-7-67 21-77 19-7 39-1 52 13 20 22 24 61 10 94H92c-6-8-11-18-16-30Z"
                  fill="currentColor"
                />
                <path
                  d="M260 241c-9-33 5-72 38-82 24-7 48 2 63 22 15 19 20 47 11 72H268c-3-3-6-7-8-12Z"
                  fill="currentColor"
                />
                <path d="M102 120c2-33 26-56 56-56 22 0 42 12 52 31-28 5-56 14-83 31-10 6-18 4-25-6Z" fill="currentColor" />
                <path d="M279 142c6-28 27-47 53-47 28 0 51 22 55 53-32-14-69-16-108-6Z" fill="currentColor" />
              </svg>
            </div>

            <figure className="president-band__portrait">
              <img
                className="president-band__portrait-photo"
                src={portraitSrc}
                alt={portraitAlt}
                loading="lazy"
                decoding="async"
              />
              <span className="president-band__logo-badge" aria-hidden="true">
                <img src="/erzurum-ticaret-borsasi-logo.png" alt="" loading="lazy" decoding="async" />
              </span>
              <figcaption>
                <span>{name}</span>
                <strong>{role}</strong>
              </figcaption>
            </figure>
          </div>

          <article className="president-band__content reveal" ref={contentRef}>
            <span className="eyebrow">{eyebrow}</span>
            <h2 id="president-band-title">{messageTitle}</h2>

            <blockquote>
              {quote.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </blockquote>

            <footer className="president-band__signature">
              <div>
                <strong>{name}</strong>
                <span>{role}</span>
              </div>
              <Link className="btn btn-primary" to="/kurumsal">
                Kurumsal bilgileri incele
              </Link>
            </footer>
          </article>
        </div>
      </div>
    </section>
  );
}
