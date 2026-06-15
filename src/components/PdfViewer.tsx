/**
 * Gömülü PDF okuyucu — "okuma salonu" konsepti.
 * pdfjs-dist ile sayfaları canvas'a render eder; küçük resim rayı,
 * yakınlaştırma, sayfa gezinme, tam ekran ve indirme denetimleri içerir.
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
// Legacy derleme: yeni ES önerilerini (Map.getOrInsertComputed vb.)
// kullanmaz; eski tarayıcılarda da çalışır.
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import type { TextItem } from "pdfjs-dist/types/src/display/api";
import "./PdfViewer.css";

GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

const ZOOM_STEPS = [0.5, 0.65, 0.8, 0.9, 1, 1.15, 1.3, 1.5, 1.75, 2, 2.5];

interface PdfViewerProps {
  /** PDF dosyasının (aynı origin) adresi */
  src: string;
  /** İndirme bağlantısı (attachment) */
  downloadUrl?: string;
  /** Dosya adı / başlık etiketi */
  title?: string;
}

type LoadState =
  | { phase: "loading"; progress: number }
  | { phase: "ready" }
  | { phase: "error" };

type ViewMode = "text" | "pdf";

/** Bir sayfanın metnini satır/paragraf bloklarına ayırır. */
type TextBlock = { kind: "heading" | "paragraph"; text: string };

async function extractPageBlocks(page: PDFPageProxy): Promise<TextBlock[]> {
  const content = await page.getTextContent();
  const items = content.items.filter((it): it is TextItem => "str" in it);
  if (items.length === 0) return [];

  // Satırlara grupla (y koordinatına göre)
  type Line = { y: number; size: number; text: string };
  const lines: Line[] = [];
  let current: Line | null = null;

  for (const item of items) {
    const y = item.transform[5] as number;
    const size = Math.abs(item.transform[3] as number) || 10;
    const str = item.str;
    if (current && Math.abs(y - current.y) <= size * 0.4) {
      current.text += str;
      if (item.hasEOL) current.text += " ";
    } else {
      if (current && current.text.trim()) lines.push(current);
      current = { y, size, text: str + (item.hasEOL ? " " : "") };
    }
  }
  if (current && current.text.trim()) lines.push(current);
  if (lines.length === 0) return [];

  // Medyan punto — başlık tespiti için
  const sizes = [...lines.map((l) => l.size)].sort((a, b) => a - b);
  const median = sizes[Math.floor(sizes.length / 2)] ?? 10;

  // Ardışık satırları paragraflara birleştir
  const blocks: TextBlock[] = [];
  let para = "";
  let prev: Line | null = null;

  const flush = () => {
    const t = para.replace(/\s+/g, " ").trim();
    if (t) blocks.push({ kind: "paragraph", text: t });
    para = "";
  };

  for (const line of lines) {
    const text = line.text.replace(/\s+/g, " ").trim();
    if (!text) continue;

    const isHeading =
      line.size > median * 1.25 && text.length <= 120;

    if (isHeading) {
      flush();
      blocks.push({ kind: "heading", text });
      prev = line;
      continue;
    }

    // Satırlar arasında büyük dikey boşluk → yeni paragraf
    const gap = prev ? prev.y - line.y : 0;
    const newPara = prev != null && gap > line.size * 1.8;
    if (newPara) flush();

    para += (para ? " " : "") + text;
    // Cümle sonu + kısa satır → paragraf bitir
    if (/[.:!?…]$/.test(text) && text.length < 60) flush();
    prev = line;
  }
  flush();

  return blocks;
}

function TextPage({
  doc,
  pageNo,
  onVisible,
}: {
  doc: PDFDocumentProxy;
  pageNo: number;
  onVisible: (pageNo: number, ratio: number) => void;
}) {
  const holderRef = useRef<HTMLElement>(null);
  const [blocks, setBlocks] = useState<TextBlock[] | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = holderRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          onVisible(pageNo, e.intersectionRatio);
          if (e.isIntersecting) setInView(true);
        }
      },
      { rootMargin: "900px 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [pageNo, onVisible]);

  useEffect(() => {
    if (!inView || blocks !== null) return;
    let cancelled = false;
    (async () => {
      try {
        const page = await doc.getPage(pageNo);
        const result = await extractPageBlocks(page);
        if (!cancelled) setBlocks(result);
      } catch {
        if (!cancelled) setBlocks([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [doc, pageNo, inView, blocks]);

  return (
    <article ref={holderRef} className="pdfv__textpage" data-page={pageNo}>
      <header className="pdfv__textpage-head mono">
        <span>Sayfa {pageNo}</span>
      </header>
      {blocks === null && (
        <div className="pdfv__textpage-skeleton" aria-hidden="true">
          <span /><span /><span />
        </div>
      )}
      {blocks !== null && blocks.length === 0 && (
        <p className="pdfv__textpage-empty mono">
          Bu sayfada seçilebilir metin yok (görsel/taranmış sayfa olabilir).
        </p>
      )}
      {blocks !== null &&
        blocks.map((b, i) =>
          b.kind === "heading" ? (
            <h3 key={i}>{b.text}</h3>
          ) : (
            <p key={i}>{b.text}</p>
          ),
        )}
    </article>
  );
}

function PageCanvas({
  doc,
  pageNo,
  width,
  onVisible,
}: {
  doc: PDFDocumentProxy;
  pageNo: number;
  width: number;
  onVisible: (pageNo: number, ratio: number) => void;
}) {
  const holderRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [aspect, setAspect] = useState<number>(Math.SQRT2); // A4 varsayılanı
  const [inView, setInView] = useState(false);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    const el = holderRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          onVisible(pageNo, e.intersectionRatio);
          // 600px tampon dışına çıkınca canvas serbest bırakılır (bellek)
          setInView(e.isIntersecting);
        }
      },
      { rootMargin: "600px 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [pageNo, onVisible]);

  useEffect(() => {
    if (!inView || width <= 0) {
      // Görünüm dışı: piksel arabelleğini bırak, yer tutucuya dön
      const canvas = canvasRef.current;
      if (canvas && canvas.width > 0) {
        canvas.width = 0;
        canvas.height = 0;
        setRendered(false);
      }
      return;
    }
    let cancelled = false;
    let page: PDFPageProxy | null = null;

    (async () => {
      try {
        page = await doc.getPage(pageNo);
        if (cancelled || !canvasRef.current) return;
        const base = page.getViewport({ scale: 1 });
        setAspect(base.height / base.width);

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const scale = (width / base.width) * dpr;
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${Math.floor(viewport.height / dpr)}px`;

        renderTaskRef.current?.cancel();
        const task = page.render({ canvasContext: ctx, viewport, canvas });
        renderTaskRef.current = task;
        await task.promise;
        if (!cancelled) setRendered(true);
      } catch (err) {
        if (import.meta.env.DEV) console.error("pdf render", err);
      }
    })();

    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel();
    };
  }, [doc, pageNo, width, inView]);

  return (
    <div
      ref={holderRef}
      className={`pdfv__page ${rendered ? "is-rendered" : ""}`}
      style={{ width, height: Math.round(width * aspect) }}
      data-page={pageNo}
    >
      <canvas ref={canvasRef} />
      {!rendered && <span className="pdfv__page-skeleton" aria-hidden="true" />}
      <span className="pdfv__page-folio mono">{pageNo}</span>
    </div>
  );
}

function Thumb({
  doc,
  pageNo,
  active,
  onSelect,
}: {
  doc: PDFDocumentProxy;
  pageNo: number;
  active: boolean;
  onSelect: (n: number) => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [inView, setInView] = useState(false);
  const doneRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setInView(true)),
      { rootMargin: "300px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || doneRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        const page = await doc.getPage(pageNo);
        if (cancelled || !canvasRef.current) return;
        const base = page.getViewport({ scale: 1 });
        const scale = (96 / base.width) * Math.min(window.devicePixelRatio || 1, 2);
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        doneRef.current = true;
      } catch {
        /* yoksay */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [doc, pageNo, inView]);

  useEffect(() => {
    const el = ref.current;
    const rail = el?.closest(".pdfv__rail-scroll");
    if (!active || !el || !rail) return;
    const elTop = (el as HTMLElement).offsetTop;
    const elBottom = elTop + el.offsetHeight;
    if (elTop < rail.scrollTop || elBottom > rail.scrollTop + rail.clientHeight) {
      rail.scrollTo({ top: elTop - rail.clientHeight / 2 + el.offsetHeight / 2 });
    }
  }, [active]);

  return (
    <button
      ref={ref}
      type="button"
      className={`pdfv__thumb ${active ? "is-active" : ""}`}
      onClick={() => onSelect(pageNo)}
      aria-label={`Sayfa ${pageNo}`}
    >
      <span className="pdfv__thumb-frame">
        <canvas ref={canvasRef} />
      </span>
      <span className="mono pdfv__thumb-no">{pageNo}</span>
    </button>
  );
}

export default function PdfViewer({ src, downloadUrl, title }: PdfViewerProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [state, setState] = useState<LoadState>({ phase: "loading", progress: 0 });
  const [zoomIdx, setZoomIdx] = useState(4); // 1.0
  const [currentPage, setCurrentPage] = useState(1);
  const [containerW, setContainerW] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("text");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenSupported =
    typeof document !== "undefined" && document.fullscreenEnabled === true;
  const [thumbsOpen, setThumbsOpen] = useState(true);
  const visibilityRef = useRef(new Map<number, number>());

  // Belgeyi yükle
  useEffect(() => {
    let cancelled = false;
    setState({ phase: "loading", progress: 0 });
    setDoc(null);
    setCurrentPage(1);
    visibilityRef.current.clear();
    const task = getDocument({ url: src });
    task.onProgress = ({ loaded, total }: { loaded: number; total?: number }) => {
      if (!cancelled && total) {
        setState({ phase: "loading", progress: Math.min(loaded / total, 1) });
      }
    };
    task.promise
      .then((d) => {
        if (cancelled) return;
        setDoc(d);
        setState({ phase: "ready" });
      })
      .catch(() => !cancelled && setState({ phase: "error" }));
    return () => {
      cancelled = true;
      task.destroy().catch(() => {});
    };
  }, [src]);

  // Kapsayıcı genişliğini izle
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerW(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [state.phase]);

  // Mod değişince görünürlük haritasını sıfırla, mevcut sayfaya geri kaydır
  useEffect(() => {
    visibilityRef.current.clear();
    const scroller = scrollRef.current;
    if (scroller) scroller.scrollTo({ top: 0 });
    setCurrentPage(1);
  }, [viewMode]);

  // Tam ekran takibi
  useEffect(() => {
    const onChange = () =>
      setIsFullscreen(document.fullscreenElement === shellRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const zoom = ZOOM_STEPS[zoomIdx];
  const pageWidth = useMemo(() => {
    if (containerW <= 0) return 0;
    const fit = Math.min(containerW - 48, 860);
    return Math.max(Math.round(fit * zoom), 220);
  }, [containerW, zoom]);

  const handleVisible = useCallback((pageNo: number, ratio: number) => {
    const map = visibilityRef.current;
    map.set(pageNo, ratio);
    let best = 1;
    let bestRatio = -1;
    map.forEach((r, n) => {
      if (r > bestRatio) {
        bestRatio = r;
        best = n;
      }
    });
    setCurrentPage(best);
  }, []);

  const goToPage = useCallback((n: number) => {
    const scroller = scrollRef.current;
    const target = scroller?.querySelector<HTMLElement>(`[data-page="${n}"]`);
    if (!scroller || !target) return;
    const top =
      target.getBoundingClientRect().top -
      scroller.getBoundingClientRect().top +
      scroller.scrollTop -
      28;
    scroller.scrollTo({ top, behavior: "smooth" });
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      shellRef.current?.requestFullscreen().catch(() => {});
    }
  }, []);

  // Klavye kısayolları
  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "+" || e.key === "=") {
        setZoomIdx((i) => Math.min(i + 1, ZOOM_STEPS.length - 1));
      } else if (e.key === "-") {
        setZoomIdx((i) => Math.max(i - 1, 0));
      }
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, []);

  const numPages = doc?.numPages ?? 0;

  return (
    <div
      ref={shellRef}
      className={`pdfv ${isFullscreen ? "is-fullscreen" : ""}`}
      tabIndex={-1}
    >
      {/* Üst çubuk */}
      <header className="pdfv__bar">
        <div className="pdfv__bar-left">
          <button
            type="button"
            className="pdfv__btn pdfv__btn--icon"
            onClick={() => setThumbsOpen((v) => !v)}
            aria-label="Sayfa panelini aç/kapat"
            aria-pressed={thumbsOpen}
            title="Sayfalar"
          >
            <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
              <rect x="1.5" y="2" width="5" height="12" rx="1" fill="none" stroke="currentColor" strokeWidth="1.4" />
              <rect x="9" y="2" width="5.5" height="5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.4" />
              <rect x="9" y="9" width="5.5" height="5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </button>
          {title && <span className="pdfv__title">{title}</span>}
          <div className="pdfv__mode mono" role="group" aria-label="Görünüm modu">
            <button
              type="button"
              className={`pdfv__mode-btn ${viewMode === "text" ? "is-active" : ""}`}
              onClick={() => setViewMode("text")}
              aria-pressed={viewMode === "text"}
            >
              Metin
            </button>
            <button
              type="button"
              className={`pdfv__mode-btn ${viewMode === "pdf" ? "is-active" : ""}`}
              onClick={() => setViewMode("pdf")}
              aria-pressed={viewMode === "pdf"}
            >
              PDF
            </button>
          </div>
        </div>

        <div className="pdfv__bar-center mono" aria-live="polite">
          <button
            type="button"
            className="pdfv__btn pdfv__btn--icon"
            onClick={() => goToPage(Math.max(currentPage - 1, 1))}
            disabled={currentPage <= 1 || !doc}
            aria-label="Önceki sayfa"
          >
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span className="pdfv__pageno">
            <strong>{doc ? currentPage : "–"}</strong>
            <span className="pdfv__pageno-sep">/</span>
            {numPages || "–"}
          </span>
          <button
            type="button"
            className="pdfv__btn pdfv__btn--icon"
            onClick={() => goToPage(Math.min(currentPage + 1, numPages))}
            disabled={!doc || currentPage >= numPages}
            aria-label="Sonraki sayfa"
          >
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path d="m6 3 5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="pdfv__bar-right">
          <div className={`pdfv__zoom mono ${viewMode === "text" ? "is-hidden" : ""}`}>
            <button
              type="button"
              className="pdfv__btn pdfv__btn--icon"
              onClick={() => setZoomIdx((i) => Math.max(i - 1, 0))}
              disabled={zoomIdx === 0}
              aria-label="Uzaklaştır"
            >
              <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                <path d="M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
            <button
              type="button"
              className="pdfv__zoom-val"
              onClick={() => setZoomIdx(4)}
              title="Sıfırla (%100)"
            >
              %{Math.round(zoom * 100)}
            </button>
            <button
              type="button"
              className="pdfv__btn pdfv__btn--icon"
              onClick={() => setZoomIdx((i) => Math.min(i + 1, ZOOM_STEPS.length - 1))}
              disabled={zoomIdx === ZOOM_STEPS.length - 1}
              aria-label="Yakınlaştır"
            >
              <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <span className="pdfv__bar-rule" aria-hidden="true" />

          {downloadUrl && (
            <a className="pdfv__btn pdfv__btn--icon" href={downloadUrl} aria-label="PDF indir" title="İndir">
              <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
                <path d="M8 2v8m0 0 3-3M8 10 5 7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 13h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </a>
          )}
          {fullscreenSupported && (
          <button
            type="button"
            className="pdfv__btn pdfv__btn--icon"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? "Tam ekrandan çık" : "Tam ekran"}
            title="Tam ekran"
          >
            {isFullscreen ? (
              <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
                <path d="M6 2v4H2M10 2v4h4M6 14v-4H2M10 14v-4h4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
                <path d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
          )}
        </div>
      </header>

      {/* Gövde */}
      <div className="pdfv__body">
        {state.phase === "loading" && (
          <div className="pdfv__status" role="status">
            <span className="pdfv__status-spinner" aria-hidden="true" />
            <p className="pdfv__status-label mono">
              Belge hazırlanıyor… %{Math.round(state.progress * 100)}
            </p>
            <span className="pdfv__status-track" aria-hidden="true">
              <span
                className="pdfv__status-fill"
                style={{ transform: `scaleX(${state.progress})` }}
              />
            </span>
          </div>
        )}

        {state.phase === "error" && (
          <div className="pdfv__status pdfv__status--error" role="alert">
            <p>Belge görüntülenemedi.</p>
            {downloadUrl && (
              <a className="btn btn-primary" href={downloadUrl}>
                PDF olarak indir
              </a>
            )}
          </div>
        )}

        {state.phase === "ready" && doc && (
          <>
            <aside
              className={`pdfv__rail ${
                thumbsOpen && viewMode === "pdf" ? "" : "is-closed"
              }`}
            >
              <div className="pdfv__rail-scroll">
                {Array.from({ length: numPages }, (_, i) => (
                  <Thumb
                    key={i + 1}
                    doc={doc}
                    pageNo={i + 1}
                    active={currentPage === i + 1}
                    onSelect={goToPage}
                  />
                ))}
              </div>
            </aside>

            <div ref={scrollRef} className="pdfv__scroll">
              {viewMode === "text" ? (
                <div className="pdfv__textpages">
                  {Array.from({ length: numPages }, (_, i) => (
                    <TextPage
                      key={i + 1}
                      doc={doc}
                      pageNo={i + 1}
                      onVisible={handleVisible}
                    />
                  ))}
                </div>
              ) : (
                <div className="pdfv__pages">
                  {pageWidth > 0 &&
                    Array.from({ length: numPages }, (_, i) => (
                      <PageCanvas
                        key={i + 1}
                        doc={doc}
                        pageNo={i + 1}
                        width={pageWidth}
                        onVisible={handleVisible}
                      />
                    ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
