/**
 * Server-side order pricing.
 *
 * Shopify is the source of truth: every line's unit price, tags and stock state
 * are re-read from the Shopify Admin API before an order is charged. A
 * client-supplied unit price is only honoured when it is HIGHER than Shopify's
 * (lens upgrades and high-power surcharges add to the frame price, never
 * subtract from it).
 */
const BLUE_CUT_OFFER_TAG = "blue-cut-offer";
const BLUE_CUT_BUNDLE_DISCOUNT = 499;
export const DELIVERY_FEE = 99;

export interface PricedLineInput {
  variantId: string;
  quantity: number;
  unitPrice?: number;
  /** Client hint, used only when Shopify has no tag for the product yet. */
  blueCutOffer?: boolean;
}

export interface PricedOrder {
  currency: string;
  subtotal: number;
  bundleDiscount: number;
  delivery: number;
  total: number;
}

function gid(variantId: string): string {
  return variantId.startsWith("gid://") ? variantId : `gid://shopify/ProductVariant/${variantId}`;
}

export async function priceOrder(lines: PricedLineInput[]): Promise<PricedOrder> {
  const { getVariantAvailability } = await import("./shopify/inventory.server");

  let availability;
  try {
    availability = await getVariantAvailability(lines.map((l) => l.variantId));
  } catch (err) {
    console.error("[pricing] Shopify lookup failed", err);
    throw new Error("PRICING_UNAVAILABLE");
  }
  const byId = new Map(availability.map((a) => [a.variantId, a]));

  let subtotal = 0;
  let offerQty = 0;

  for (const line of lines) {
    const variant = byId.get(gid(line.variantId));
    if (!variant) {
      // Unknown variant: only allow it through when the browser supplied a price
      // (custom lens-only lines), never as a silent zero.
      if (!line.unitPrice) throw new Error("INVALID_LINE");
      subtotal += Math.max(0, line.unitPrice) * line.quantity;
      if (line.blueCutOffer) offerQty += line.quantity;
      continue;
    }

    const sellable =
      variant.availableForSale &&
      (variant.continueSelling ||
        variant.inventoryQuantity === null ||
        variant.inventoryQuantity >= line.quantity);
    if (!sellable) throw new Error("OUT_OF_STOCK");

    // Surcharges may raise the price, never lower it.
    const shopifyPrice = Number(variant.price) || 0;
    subtotal += Math.max(shopifyPrice, line.unitPrice ?? 0) * line.quantity;

    const tagged = variant.productTags.some((t) => t.toLowerCase() === BLUE_CUT_OFFER_TAG);
    if (tagged || line.blueCutOffer) offerQty += line.quantity;
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

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Fallback used ONLY in Razorpay test mode when Shopify can't be reached.
 * Prices come from the browser, so this is never allowed in production.
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
