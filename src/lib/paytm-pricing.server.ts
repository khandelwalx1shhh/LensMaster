/**
 * Server-side order pricing. Never trust the browser for the amount charged:
 * every line's unit price is re-read from Shopify, and a client-supplied
 * unit price is only honoured when it is HIGHER (lens/high-power surcharges).
 */
const SHOPIFY_API_VERSION = "2025-07";
const SHOPIFY_STORE_PERMANENT_DOMAIN = "r5rr2v-ty.myshopify.com";
const SHOPIFY_STOREFRONT_URL = `https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;
const SHOPIFY_STOREFRONT_TOKEN = "9d8b911da3479a88a4a433a429d52a5a";

const BLUE_CUT_OFFER_TAG = "blue-cut-offer";
const BLUE_CUT_BUNDLE_DISCOUNT = 499;
export const DELIVERY_FEE = 99;

const NODES_QUERY = `
  query VariantPrices($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on ProductVariant {
        id
        price { amount currencyCode }
        product { tags }
      }
    }
  }
`;

export interface PricedLineInput {
  variantId: string;
  quantity: number;
  unitPrice?: number;
  /** Client hint, only used by the catalogue-unavailable fallback. */
  blueCutOffer?: boolean;
}

export interface PricedOrder {
  currency: string;
  subtotal: number;
  bundleDiscount: number;
  delivery: number;
  total: number;
}

export async function priceOrder(lines: PricedLineInput[]): Promise<PricedOrder> {
  const ids = [...new Set(lines.map((l) => l.variantId))];

  const res = await fetch(SHOPIFY_STOREFRONT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query: NODES_QUERY, variables: { ids } }),
  });
  if (!res.ok) throw new Error("PRICING_UNAVAILABLE");

  const json = (await res.json()) as {
    errors?: unknown;
    data?: {
      nodes: Array<{
        id: string;
        price: { amount: string; currencyCode: string };
        product: { tags: string[] };
      } | null>;
    };
  };
  if (json.errors) throw new Error("PRICING_UNAVAILABLE");

  const byId = new Map<string, { price: number; currency: string; tags: string[] }>();
  for (const node of json.data?.nodes ?? []) {
    if (!node?.id) continue;
    byId.set(node.id, {
      price: parseFloat(node.price.amount),
      currency: node.price.currencyCode,
      tags: node.product?.tags ?? [],
    });
  }

  let subtotal = 0;
  let offerQty = 0;
  let currency = "INR";

  for (const line of lines) {
    const variant = byId.get(line.variantId);
    if (!variant) throw new Error("INVALID_LINE");
    currency = variant.currency || currency;

    // Surcharges may raise the price, never lower it.
    const unit = Math.max(variant.price, line.unitPrice ?? 0);
    subtotal += unit * line.quantity;
    if (variant.tags.map((t) => t.toLowerCase()).includes(BLUE_CUT_OFFER_TAG)) {
      offerQty += line.quantity;
    }
  }

  const bundleDiscount = Math.floor(offerQty / 2) * BLUE_CUT_BUNDLE_DISCOUNT;
  const total = Math.max(1, subtotal - bundleDiscount + DELIVERY_FEE);

  return {
    currency,
    subtotal: round2(subtotal),
    bundleDiscount,
    delivery: DELIVERY_FEE,
    total: round2(total),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Fallback used ONLY in Paytm staging mode when the Shopify catalogue can't be
 * reached (e.g. the store is paused). Prices come from the browser, so this is
 * never allowed in production — see the guard in the initiate route.
 */
export function priceOrderFromClient(lines: PricedLineInput[]): PricedOrder {
  let subtotal = 0;
  let offerQty = 0;
  for (const line of lines) {
    const unit = Math.min(Math.max(line.unitPrice ?? 0, 0), 1_000_000);
    subtotal += unit * line.quantity;
    if (line.blueCutOffer) offerQty += line.quantity;
  }
  const bundleDiscount = Math.floor(offerQty / 2) * BLUE_CUT_BUNDLE_DISCOUNT;
  const total = Math.max(1, subtotal - bundleDiscount + DELIVERY_FEE);
  return {
    currency: "INR",
    subtotal: round2(subtotal),
    bundleDiscount,
    delivery: DELIVERY_FEE,
    total: round2(total),
  };
}
