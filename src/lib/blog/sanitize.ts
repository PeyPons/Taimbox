import DOMPurify from "dompurify";

const ALLOWED_TAGS = [
  "a", "b", "br", "code", "em", "i", "p", "span", "strong", "sub", "sup",
  "u", "small", "mark", "abbr", "cite", "kbd",
];

const ALLOWED_TAGS_FULL = [
  ...ALLOWED_TAGS,
  "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li",
  "blockquote", "pre", "hr",
  "table", "thead", "tbody", "tr", "th", "td",
  "img", "figure", "figcaption",
  "div",
];

const ALLOWED_ATTR = [
  "href", "title", "target", "rel",
  "class", "id",
  "aria-label", "aria-hidden", "role",
  "src", "alt", "width", "height", "loading",
  "colspan", "rowspan",
];

const PURIFY_CONFIG_INLINE: DOMPurify.Config = {
  ALLOWED_TAGS,
  ALLOWED_ATTR,
};

const PURIFY_CONFIG_FULL: DOMPurify.Config = {
  ALLOWED_TAGS: ALLOWED_TAGS_FULL,
  ALLOWED_ATTR,
};

/** Sanitiza HTML inline (parrafos, items de lista, callouts): solo formato basico + enlaces. */
export function sanitizeInlineHtml(input: string): string {
  return DOMPurify.sanitize(input, PURIFY_CONFIG_INLINE) as string;
}

/** Sanitiza HTML libre (bloque html): permite estructura mas amplia, sigue sin scripts ni event handlers. */
export function sanitizeHtml(input: string): string {
  return DOMPurify.sanitize(input, PURIFY_CONFIG_FULL) as string;
}
