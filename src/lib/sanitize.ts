// Centralized HTML sanitizer for any third-party HTML (Shopify descriptions,
// reviews). Protects against OWASP A03 (Injection / XSS).
import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "p", "br", "strong", "em", "b", "i", "u", "s",
  "ul", "ol", "li",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "a", "blockquote", "code", "pre", "span", "div",
  "table", "thead", "tbody", "tr", "th", "td",
  "img",
];

const ALLOWED_ATTR = ["href", "title", "target", "rel", "src", "alt", "class"];

export function sanitizeHtml(dirty: string): string {
  if (!dirty) return "";
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form", "input"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur"],
    // Force noopener on any anchor with target
    ADD_ATTR: ["target"],
  });
}
