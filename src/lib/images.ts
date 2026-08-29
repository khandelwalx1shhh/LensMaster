/**
 * Shopify CDN image helpers.
 *
 * Shopify's CDN resizes on the fly via `width`/`height` query params, so we ask
 * for the size we actually render instead of downloading full-resolution files.
 */
const SHOPIFY_CDN = /(^https?:\/\/cdn\.shopify\.com\/)/i;

export function cdnImage(url: string, width: number): string {
  if (!url || !SHOPIFY_CDN.test(url)) return url;
  try {
    const u = new URL(url);
    u.searchParams.set("width", String(width));
    return u.toString();
  } catch {
    return url;
  }
}

/** Build a srcset across common rendered widths. */
export function cdnSrcSet(url: string, widths: number[] = [320, 480, 640, 960]): string | undefined {
  if (!url || !SHOPIFY_CDN.test(url)) return undefined;
  return widths.map((w) => `${cdnImage(url, w)} ${w}w`).join(", ");
}
