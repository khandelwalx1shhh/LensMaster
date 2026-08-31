/**
 * Storefront catalogue types + client helpers.
 *
 * Shopify is the single source of truth for products, images, variants, SKUs,
 * prices, compare-at prices, inventory and collections. The browser NEVER talks
 * to Shopify: every read goes through the Lens Master backend
 * (`src/lib/catalog.functions.ts` → `src/lib/shopify/*.server.ts`), which holds
 * the Admin API credentials server-side.
 */
import {
  getProducts,
  getProductByHandle,
  searchCatalogue,
  getCollections,
} from "./catalog.functions";

export type StockLevel = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export interface ShopifyImage {
  url: string;
  altText: string | null;
}

export interface ShopifyVariant {
  id: string;
  title: string;
  sku: string | null;
  price: { amount: string; currencyCode: string };
  compareAtPrice: { amount: string; currencyCode: string } | null;
  availableForSale: boolean;
  inventoryQuantity: number | null;
  stockLevel: StockLevel;
  selectedOptions: Array<{ name: string; value: string }>;
}

export interface ShopifyProduct {
  node: {
    id: string;
    title: string;
    description: string;
    descriptionHtml?: string;
    handle: string;
    vendor?: string;
    productType?: string;
    status?: string;
    tags: string[];
    /** Lens Master optical metafields (category, frame_shape, lens_supported…). */
    optical?: Record<string, string>;
    totalInventory?: number | null;
    availableForSale?: boolean;
    priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
    compareAtPrice?: { amount: string; currencyCode: string } | null;
    images: { edges: Array<{ node: ShopifyImage }> };
    variants: { edges: Array<{ node: ShopifyVariant }> };
    options: Array<{ name: string; values: string[] }>;
  };
}

export interface StorefrontCollection {
  id: string;
  title: string;
  handle: string;
  description: string;
  image: ShopifyImage | null;
  productsCount: number;
}

/* ---------------------------------------------------- catalogue reads */

/**
 * Live Shopify catalogue. There is no demo/sample fallback: if Shopify is
 * unreachable the error surfaces so the UI can show a proper error state
 * rather than fake products.
 */
export async function fetchProducts(first = 24, query?: string): Promise<ShopifyProduct[]> {
  return getProducts({ data: { first, query: query ?? null } });
}

export async function fetchProductByHandle(handle: string): Promise<ShopifyProduct["node"] | null> {
  const product = await getProductByHandle({ data: { handle } });
  return product ? product.node : null;
}

export async function fetchSearchResults(term: string, first = 20): Promise<ShopifyProduct[]> {
  if (term.trim().length < 2) return [];
  return searchCatalogue({ data: { term, first } });
}

export async function fetchCollections(): Promise<StorefrontCollection[]> {
  return getCollections();
}

/* ---------------------------------------------------- stock helpers */

export function variantStockLabel(variant?: ShopifyVariant | null): string {
  if (!variant) return "Unavailable";
  if (!variant.availableForSale) return "Out of stock";
  if (variant.stockLevel === "LOW_STOCK" && variant.inventoryQuantity !== null) {
    return `Only ${variant.inventoryQuantity} left`;
  }
  return "In stock";
}

export function isProductSellable(node?: ShopifyProduct["node"] | null): boolean {
  if (!node) return false;
  return node.variants.edges.some((e) => e.node.availableForSale);
}

export function discountPercent(
  price: { amount: string } | null | undefined,
  compareAt: { amount: string } | null | undefined,
): number | null {
  if (!price || !compareAt) return null;
  const p = parseFloat(price.amount);
  const c = parseFloat(compareAt.amount);
  if (!Number.isFinite(p) || !Number.isFinite(c) || c <= p) return null;
  return Math.round(((c - p) / c) * 100);
}

export function formatPrice(amount: string | number, currencyCode = "INR") {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: currencyCode, maximumFractionDigits: 0 }).format(n);
  } catch {
    return `${currencyCode} ${n.toFixed(0)}`;
  }
}

/* ---------------------------------------------------- brand helpers */

export function isHouseBrand(vendor?: string | null): boolean {
  if (!vendor) return true;
  const v = vendor.trim().toLowerCase();
  if (!v) return true;
  if (
    v.includes("lens master") ||
    v.includes("lensmaster") ||
    v.includes("the swadesh") ||
    v.includes("swadesh") ||
    v === "in-house" ||
    v === "in house" ||
    v === "generic" ||
    v === "default"
  ) {
    return true;
  }
  return false;
}

/* ---------------------------------------------------- blue cut offer */

export const BLUE_CUT_OFFER_TAG = "blue-cut-offer";
export const BLUE_CUT_DISCOUNT_CODE = "BLUECUT2";
export const BLUE_CUT_SINGLE_PRICE = 849;
export const BLUE_CUT_BUNDLE_PRICE = 1199;
export const BLUE_CUT_HIGH_POWER_SINGLE_PRICE = 1049;
export const BLUE_CUT_HIGH_POWER_BUNDLE_PRICE = 1599;
export const BLUE_CUT_HIGH_POWER_THRESHOLD = 4;
export const BLUE_CUT_BUNDLE_DISCOUNT = BLUE_CUT_SINGLE_PRICE * 2 - BLUE_CUT_BUNDLE_PRICE; // 499

export function isHighPowerRx(
  eyes: Array<Record<string, string | undefined>>,
  threshold = BLUE_CUT_HIGH_POWER_THRESHOLD,
): boolean {
  for (const eye of eyes) {
    for (const key of ["sph", "cyl"]) {
      const raw = (eye?.[key] ?? "").toString().replace(/[^0-9.\-+]/g, "");
      if (!raw) continue;
      const n = parseFloat(raw);
      if (!isNaN(n) && Math.abs(n) > threshold) return true;
    }
  }
  return false;
}

export function isBlueCutOfferProduct(product?: ShopifyProduct["node"] | ShopifyProduct | null): boolean {
  const node = (product as any)?.node ?? product;
  return !!node?.tags?.includes(BLUE_CUT_OFFER_TAG);
}

export interface BlueCutBundleSummary {
  offerQty: number;
  regularQty: number;
  regularTotal: number;
  bundleDiscount: number;
  finalTotal: number;
  eligibleForBundle: boolean;
}

export function calculateBlueCutBundle(
  items: Array<{ product: ShopifyProduct; variantId: string; price: { amount: string; currencyCode: string }; quantity: number }>,
): BlueCutBundleSummary {
  let offerQty = 0;
  let offerTotalBeforeDiscount = 0;
  let regularTotal = 0;
  let regularQty = 0;

  for (const item of items ?? []) {
    const qty = item?.quantity || 1;
    const unitPrice = parseFloat(item?.price?.amount || "0") || 0;
    const prod = (item?.product as any)?.node ?? item?.product;
    if (isBlueCutOfferProduct(prod)) {
      offerQty += qty;
      offerTotalBeforeDiscount += unitPrice * qty;
    } else {
      regularQty += qty;
      regularTotal += unitPrice * qty;
    }
  }

  const pairs = Math.floor(offerQty / 2);
  const bundleDiscount = pairs * BLUE_CUT_BUNDLE_DISCOUNT;
  const offerTotalAfterDiscount = offerTotalBeforeDiscount - bundleDiscount;
  const finalTotal = regularTotal + offerTotalAfterDiscount;

  return { offerQty, regularQty, regularTotal, bundleDiscount, finalTotal, eligibleForBundle: pairs > 0 };
}

/* ------------------------------------- product category & lens options */

export type ProductCategory = "sunglasses" | "blue-cut" | "prescription" | "contact-lens" | "reading" | "kids" | "other";

/**
 * Category is derived from Shopify data only — the `lensmaster.category`
 * metafield first, then productType, then tags. Nothing is hardcoded per
 * product in the frontend.
 */
export function getProductCategory(node?: ShopifyProduct["node"] | null): ProductCategory {
  if (!node) return "other";

  const meta = (node.optical?.["category"] ?? "").toLowerCase().replace(/[\s_]+/g, "-");
  const direct: Record<string, ProductCategory> = {
    sunglasses: "sunglasses",
    "blue-cut": "blue-cut",
    "computer-glasses": "blue-cut",
    "blue-light": "blue-cut",
    "power-spectacles": "prescription",
    prescription: "prescription",
    "reading-glasses": "reading",
    reading: "reading",
    "kids-glasses": "kids",
    kids: "kids",
    "contact-lenses": "contact-lens",
    "contact-lens": "contact-lens",
  };
  if (direct[meta]) return direct[meta];

  const type = (node.productType ?? "").toLowerCase();
  const tags = (node.tags ?? []).map((t) => t.toLowerCase());
  const has = (needle: string) => type.includes(needle) || tags.includes(needle);

  if (has("sunglass")) return "sunglasses";
  if (type.includes("blue cut") || type.includes("blue-cut") || has("blue-cut-offer") || has("blue-cut") || has("blue-light") || type.includes("computer")) return "blue-cut";
  if (has("contact") || has("contact-lens") || has("contacts")) return "contact-lens";
  if (has("reading")) return "reading";
  if (has("kids") || has("children")) return "kids";
  if (type.includes("frame") || type.includes("optical") || type.includes("spectacle") || has("prescription")) return "prescription";
  return "other";
}

export function requiresPrescription(cat: ProductCategory): boolean {
  return cat === "blue-cut" || cat === "prescription" || cat === "contact-lens" || cat === "kids";
}

/** Prescription sunglasses are opt-in per product via a Shopify metafield. */
export function supportsPrescription(node?: ShopifyProduct["node"] | null): boolean {
  const flag = (node?.optical?.["prescription_supported"] ?? "").toLowerCase();
  if (flag === "true" || flag === "yes" || flag === "1") return true;
  if (flag === "false" || flag === "no" || flag === "0") return false;
  return requiresPrescription(getProductCategory(node));
}

export interface LensOption {
  id: string;
  label: string;
  note?: string;
}

/**
 * Supported lens types / materials / coatings come from Shopify metafields when
 * present (comma-separated), otherwise from sensible category defaults.
 */
function fromMetafield(node: ShopifyProduct["node"] | null | undefined, key: string): string[] | null {
  const raw = node?.optical?.[key];
  if (!raw) return null;
  const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
  return parts.length ? parts : null;
}

export function getSupportedLensTypes(node?: ShopifyProduct["node"] | null): string[] {
  const meta = fromMetafield(node, "lens_supported");
  if (meta) return meta;
  if (isBlueCutOfferProduct(node)) return ["Single Vision"];
  return ["Single Vision", "Bifocal", "Progressive"];
}

export function getSupportedLensMaterials(node?: ShopifyProduct["node"] | null): string[] {
  return fromMetafield(node, "lens_material_supported") ?? ["Plastic", "Polycarbonate", "High Index"];
}

export function getSupportedCoatings(node?: ShopifyProduct["node"] | null): string[] {
  return (
    fromMetafield(node, "lens_coatings_supported") ?? [
      "Anti-Glare",
      "Blue Light Protection",
      "UV Protection",
      "Scratch Resistant",
    ]
  );
}

export function getLensOptions(cat: ProductCategory): { options: LensOption[]; defaultId: string } | null {
  if (cat === "blue-cut") {
    return {
      defaultId: "blue-cut",
      options: [{ id: "blue-cut", label: "Blue Cut Lens", note: "Included · recommended for screens" }],
    };
  }
  if (cat === "prescription" || cat === "reading" || cat === "kids") {
    return {
      defaultId: "blue-cut",
      options: [
        { id: "blue-cut", label: "Blue Cut", note: "Included · recommended for screens" },
        { id: "anti-glare", label: "Anti-Glare Coating", note: "Upgrade — our team will confirm" },
        { id: "photochromic", label: "Photochromic (light-adaptive)", note: "Upgrade — our team will confirm" },
        { id: "progressive", label: "Progressive", note: "Upgrade — our team will confirm" },
      ],
    };
  }
  if (cat === "contact-lens") {
    return {
      defaultId: "as-per-rx",
      options: [{ id: "as-per-rx", label: "As per prescription", note: "We match your Rx exactly" }],
    };
  }
  return null;
}
