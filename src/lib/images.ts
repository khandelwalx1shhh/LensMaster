/**
 * Shopify CDN image helpers.
 *
 * Shopify's CDN resizes and transcodes on the fly via query params, so we ask
 * for exact rendered width and modern WebP compression instead of full-res files.
 */
const SHOPIFY_CDN = /(^https?:\/\/cdn\.shopify\.com\/)/i;

export function cdnImage(url: string, width: number, format: "webp" | "pjpg" | "auto" = "webp"): string {
  if (!url || !SHOPIFY_CDN.test(url)) return url;
  try {
    const u = new URL(url);
    u.searchParams.set("width", String(width));
    if (format && format !== "auto") {
      u.searchParams.set("format", format);
    }
    return u.toString();
  } catch {
    return url;
  }
}

/** Build a responsive srcset across common viewport widths. */
export function cdnSrcSet(
  url: string,
  widths: number[] = [320, 480, 640, 960],
  format: "webp" | "pjpg" | "auto" = "webp"
): string | undefined {
  if (!url || !SHOPIFY_CDN.test(url)) return undefined;
  return widths.map((w) => `${cdnImage(url, w, format)} ${w}w`).join(", ");
}

