// Centralized HTML sanitizer for any third-party HTML (Shopify descriptions,
// reviews). Protects against OWASP A03 (Injection / XSS) across SSR and browser.
import DOMPurify from "dompurify";

const ALLOWED_TAGS = [
  "p", "br", "strong", "em", "b", "i", "u", "s",
  "ul", "ol", "li",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "a", "blockquote", "code", "pre", "span", "div",
  "table", "thead", "tbody", "tr", "th", "td",
  "img",
];

const ALLOWED_ATTR = ["href", "title", "target", "rel", "src", "alt", "class"];

function sanitizeServerHtml(dirty: string): string {
  if (!dirty) return "";
  // Strip dangerous tags and their content
  let clean = dirty.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
  clean = clean.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "");
  clean = clean.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "");
  clean = clean.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "");
  clean = clean.replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, "");
  // Strip inline on* event handlers (e.g. onerror=, onclick=)
  clean = clean.replace(/\s+on[a-z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, "");
  // Strip javascript: URLs in href/src
  clean = clean.replace(/(href|src)\s*=\s*['"]\s*javascript:[^'"]*['"]/gi, "");
  return clean;
}

export function sanitizeHtml(dirty: string): string {
  if (!dirty) return "";
  if (typeof window !== "undefined" && DOMPurify && typeof DOMPurify.sanitize === "function") {
    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
      ALLOW_DATA_ATTR: false,
      FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form", "input"],
      FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur"],
      ADD_ATTR: ["target"],
    });
  }
  return sanitizeServerHtml(dirty);
}

