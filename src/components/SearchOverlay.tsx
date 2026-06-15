/**
 * Site içi arama katmanı — backend'in Türkçe tam metin arama ucunu
 * (/api/v1/news/search) kullanır. Header'daki büyüteç ile açılır,
 * Esc veya zemine tıklayarak kapanır.
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { searchNews, type PublicNewsItem } from "../lib/publicApi";
import { resolveMediaUrl } from "../lib/resolveMediaUrl";
import "./SearchOverlay.css";

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

type SearchState =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "done"; rows: PublicNewsItem[]; total: number }
  | { phase: "error" };

export default function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<SearchState>({ phase: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Açılınca odaklan, kapanınca sıfırla
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      document.body.style.overflow = "hidden";
      return () => {
        clearTimeout(t);
        document.body.style.overflow = "";
      };
    }
    setQuery("");
    setState({ phase: "idle" });
    return undefined;
  }, [open]);

  // Esc ile kapat
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Debounce'lu arama
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    clearTimeout(debounceRef.current);
    if (q.length < 2) {
      setState({ phase: "idle" });
      return;
    }
    setState({ phase: "loading" });
    debounceRef.current = setTimeout(async () => {
      try {
        const { rows, total } = await searchNews(q, 8);
        setState({ phase: "done", rows, total });
      } catch {
        setState({ phase: "error" });
      }
    }, 280);
    return () => clearTimeout(debounceRef.current);
  }, [query, open]);

  if (!open) return null;

  return (
    <div
      className="search-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Site içi arama"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="search-overlay__panel">
        <div className="search-overlay__bar">
          <svg
            className="search-overlay__icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
            <path d="m16.5 16.5 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Haberlerde ara… (en az 2 karakter)"
            aria-label="Arama"
          />
          <button
            type="button"
            className="search-overlay__close mono"
            onClick={onClose}
            aria-label="Aramayı kapat"
          >
            ESC
          </button>
        </div>

        <div className="search-overlay__results">
          {state.phase === "idle" && (
            <p className="search-overlay__hint mono">
              Haber başlığı, özet veya içerikte geçen bir ifade yazın.
            </p>
          )}
          {state.phase === "loading" && (
            <p className="search-overlay__hint mono">Aranıyor…</p>
          )}
          {state.phase === "error" && (
            <p className="search-overlay__hint search-overlay__hint--error mono">
              Arama sırasında bir sorun oluştu. Lütfen tekrar deneyin.
            </p>
          )}
          {state.phase === "done" && state.rows.length === 0 && (
            <p className="search-overlay__hint mono">
              "{query.trim()}" için sonuç bulunamadı.
            </p>
          )}
          {state.phase === "done" && state.rows.length > 0 && (
            <>
              <ul className="search-overlay__list">
                {state.rows.map((item) => {
                  const cover = item.coverUrl ? resolveMediaUrl(item.coverUrl) : null;
                  return (
                    <li key={item.id}>
                      <Link
                        to={`/haberler/${item.slug}`}
                        className="search-overlay__item"
                        onClick={onClose}
                      >
                        {cover ? (
                          <img src={cover} alt="" loading="lazy" />
                        ) : (
                          <span className="search-overlay__thumb-placeholder" aria-hidden />
                        )}
                        <span className="search-overlay__item-body">
                          <strong>{item.title}</strong>
                          {item.excerpt && <small>{item.excerpt}</small>}
                          <span className="mono search-overlay__item-meta">
                            {item.category ?? "Haber"}
                            {item.publishedAt &&
                              ` · ${new Date(item.publishedAt).toLocaleDateString("tr-TR")}`}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              {state.total > state.rows.length && (
                <p className="search-overlay__more mono">
                  Toplam {state.total} sonuçtan ilk {state.rows.length} tanesi gösteriliyor.{" "}
                  <Link to="/haberler" onClick={onClose}>
                    Tüm haberlere git →
                  </Link>
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
