import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "u",
  "s",
  "h1",
  "h2",
  "h3",
  "ul",
  "ol",
  "li",
  "blockquote",
  "code",
  "pre",
  "a",
  "hr",
  "img",
  "div",
  "span",
  "figure",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
];

/** Defense-in-depth sanitization before dangerouslySetInnerHTML. */
export function sanitizeRichHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ["href", "target", "rel", "src", "alt", "width", "height", "loading", "class"],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|data):)/i,
  });
}
