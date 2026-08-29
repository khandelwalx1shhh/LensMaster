import type { ShopifyProduct } from "./shopify";

/** Search synonyms — typing any term in a group matches all terms in that group. */
const SYNONYM_GROUPS: string[][] = [
  [
    "blue cut", "bluecut", "blue-cut", "blue light", "bluelight", "blue ray",
    "blue protection", "blue protect", "blue block", "blue blocker",
    "anti glare", "antiglare", "screen glasses", "computer glasses", "zero power",
  ],
  ["sunglasses", "sunglass", "shades", "goggles", "sun glasses"],
  ["contact lens", "contacts", "lenses", "contact lenses"],
  ["prescription", "rx", "powered", "power glasses", "eyeglasses", "spectacles", "frames", "optical"],
  ["reading", "readers", "reading glasses", "presbyopia"],
];

function normalise(v: string) {
  return v.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function expand(term: string): string[] {
  const t = normalise(term);
  const out = new Set<string>([t]);
  for (const group of SYNONYM_GROUPS) {
    if (group.some((g) => normalise(g) === t || normalise(g).includes(t) || t.includes(normalise(g)))) {
      group.forEach((g) => out.add(normalise(g)));
    }
  }
  return [...out].filter(Boolean);
}

function haystack(p: ShopifyProduct): string {
  const n = p.node as ShopifyProduct["node"] & { productType?: string; tags?: string[]; vendor?: string };
  return normalise(
    [n.title, n.description, n.handle, n.vendor ?? "", n.productType ?? "", (n.tags ?? []).join(" ")].join(" "),
  );
}

/** Cheap edit-distance-1 check for typo tolerance ("sunglases" -> "sunglasses"). */
function closeEnough(word: string, target: string): boolean {
  if (Math.abs(word.length - target.length) > 1) return false;
  if (word.length < 4) return false;
  let i = 0, j = 0, diffs = 0;
  while (i < word.length && j < target.length) {
    if (word[i] === target[j]) { i++; j++; continue; }
    if (++diffs > 1) return false;
    if (word.length > target.length) i++;
    else if (word.length < target.length) j++;
    else { i++; j++; }
  }
  return diffs + (word.length - i) + (target.length - j) <= 1;
}

function scoreProduct(p: ShopifyProduct, term: string): number {
  const hay = haystack(p);
  const title = normalise(p.node.title);
  const vendor = normalise((p.node as { vendor?: string }).vendor ?? "");
  const variants = expand(term);
  const words = normalise(term).split(" ").filter(Boolean);
  const hayWords = hay.split(" ");

  let score = 0;
  for (const v of variants) {
    if (!v) continue;
    if (title === v) score += 100;
    else if (title.includes(v)) score += 60;
    if (vendor.includes(v)) score += 40;
    if (hay.includes(v)) score += 20;
  }
  for (const w of words) {
    if (w.length < 2) continue;
    if (title.includes(w)) score += 15;
    else if (hay.includes(w)) score += 8;
    else if (hayWords.some((hw) => closeEnough(w, hw))) score += 5;
  }
  return score;
}

/** Ranked results. Falls back to loose/typo matching so a query always shows something related. */
export function searchProducts(products: ShopifyProduct[], term: string): ShopifyProduct[] {
  if (!normalise(term)) return [];
  const scored = products
    .map((p) => ({ p, s: scoreProduct(p, term) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);
  return scored.map((x) => x.p);
}

/** Suggestions when the exact query has no hits — related items from the same intent. */
export function relatedProducts(products: ShopifyProduct[], term: string, limit = 6): ShopifyProduct[] {
  const words = normalise(term).split(" ").filter((w) => w.length >= 3);
  if (!words.length) return products.slice(0, limit);
  const scored = products
    .map((p) => {
      const hay = haystack(p);
      let s = 0;
      for (const w of words) {
        for (let len = Math.min(w.length, 6); len >= 3; len--) {
          if (hay.includes(w.slice(0, len))) { s += len; break; }
        }
      }
      return { p, s };
    })
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);
  return (scored.length ? scored.map((x) => x.p) : products).slice(0, limit);
}
