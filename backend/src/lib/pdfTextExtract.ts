import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";

const __dirname = dirname(fileURLToPath(import.meta.url));
GlobalWorkerOptions.workerSrc = join(
  __dirname,
  "../../node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs",
);

type TextBlock = { kind: "heading" | "paragraph"; text: string };

type PdfTextItem = { str: string; transform: number[]; hasEOL?: boolean };

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isPdfTextItem(item: unknown): item is PdfTextItem {
  return (
    typeof item === "object" &&
    item !== null &&
    "str" in item &&
    "transform" in item &&
    Array.isArray((item as PdfTextItem).transform)
  );
}

async function extractPageBlocks(page: PDFPageProxy): Promise<TextBlock[]> {
  const content = await page.getTextContent();
  const items: PdfTextItem[] = [];
  for (const item of content.items) {
    if (isPdfTextItem(item)) items.push(item);
  }
  if (items.length === 0) return [];

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

  const sizes = [...lines.map((l) => l.size)].sort((a, b) => a - b);
  const median = sizes[Math.floor(sizes.length / 2)] ?? 10;

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

    const isHeading = line.size > median * 1.25 && text.length <= 120;
    if (isHeading) {
      flush();
      blocks.push({ kind: "heading", text });
      prev = line;
      continue;
    }

    const gap = prev ? prev.y - line.y : 0;
    const newPara = prev != null && gap > line.size * 1.8;
    if (newPara) flush();

    para += (para ? " " : "") + text;
    if (/[.:!?…]$/.test(text) && text.length < 60) flush();
    prev = line;
  }
  flush();

  return blocks;
}

export function blocksToHtml(blocks: TextBlock[]): string {
  if (blocks.length === 0) return "";
  return blocks
    .map((b) =>
      b.kind === "heading"
        ? `<h2>${escapeHtml(b.text)}</h2>`
        : `<p>${escapeHtml(b.text)}</p>`,
    )
    .join("\n");
}

function toPdfData(data: Uint8Array | Buffer): Uint8Array {
  return new Uint8Array(data);
}

export async function extractPdfTextHtml(data: Uint8Array | Buffer): Promise<string> {
  const task = getDocument({ data: toPdfData(data) });
  const doc: PDFDocumentProxy = await task.promise;
  const parts: string[] = [];

  for (let pageNo = 1; pageNo <= doc.numPages; pageNo += 1) {
    const page = await doc.getPage(pageNo);
    const blocks = await extractPageBlocks(page);
    const html = blocksToHtml(blocks);
    if (html) {
      if (doc.numPages > 1) {
        parts.push(`<h2>Sayfa ${pageNo}</h2>`);
      }
      parts.push(html);
    }
  }

  await doc.destroy();
  return parts.join("\n").trim();
}

export async function renderPdfPageToPng(
  data: Uint8Array | Buffer,
  pageNo = 1,
  scale = 2,
): Promise<Buffer> {
  const { createCanvas } = await import("@napi-rs/canvas");
  const task = getDocument({ data: toPdfData(data) });
  const doc = await task.promise;
  const page = await doc.getPage(pageNo);
  const viewport = page.getViewport({ scale });
  const canvas = createCanvas(viewport.width, viewport.height);
  const context = canvas.getContext("2d");
  await page.render({
    canvasContext: context as never,
    viewport,
    canvas: canvas as never,
  }).promise;
  const png = canvas.toBuffer("image/png");
  await doc.destroy();
  return png;
}
