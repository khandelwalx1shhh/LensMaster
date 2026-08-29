/**
 * Pure mapping between the Shopify Admin product shape and the storefront
 * product shape the Lens Master UI renders. No credentials, no I/O — safe to
 * import from either side of the server boundary.
 */
import type { ShopifyAdminProduct } from "../shopify/products.server";
import type { ShopifyProduct, ShopifyVariant, StockLevel } from "../shopify";

const LOW_STOCK_THRESHOLD = 5;

/**
 * Shopify is authoritative for sellability.
 *
 * `availableForSale` already folds in tracking + policy, but we recompute the
 * DENY / zero-quantity case explicitly so the storefront can never sell a
 * tracked variant that Shopify has run out of.
 */
export function resolveStock(v: {
  availableForSale: boolean;
  inventoryQuantity: number | null;
  inventoryPolicy: string;
  tracked: boolean;
}): { sellable: boolean; level: StockLevel; quantity: number | null } {
  const continueSelling = v.inventoryPolicy?.toUpperCase() === "CONTINUE";
  const qty = v.tracked ? (v.inventoryQuantity ?? 0) : null;

  if (!v.availableForSale) return { sellable: false, level: "OUT_OF_STOCK", quantity: qty };
  if (!v.tracked) return { sellable: true, level: "IN_STOCK", quantity: null };
  if ((qty ?? 0) <= 0) {
    return continueSelling
      ? { sellable: true, level: "IN_STOCK", quantity: qty }
      : { sellable: false, level: "OUT_OF_STOCK", quantity: qty };
  }
  return {
    sellable: true,
    level: (qty ?? 0) <= LOW_STOCK_THRESHOLD ? "LOW_STOCK" : "IN_STOCK",
    quantity: qty,
  };
}

function toVariant(node: ShopifyAdminProduct["variants"]["edges"][number]["node"]): ShopifyVariant {
  const tracked = node.inventoryItem?.tracked ?? false;
  const stock = resolveStock({
    availableForSale: node.availableForSale,
    inventoryQuantity: node.inventoryQuantity,
    inventoryPolicy: node.inventoryPolicy,
    tracked,
  });
  return {
    id: node.id,
    title: node.title,
    sku: node.sku ?? null,
    price: { amount: String(node.price), currencyCode: "INR" },
    compareAtPrice: node.compareAtPrice ? { amount: String(node.compareAtPrice), currencyCode: "INR" } : null,
    availableForSale: stock.sellable,
    inventoryQuantity: stock.quantity,
    stockLevel: stock.level,
    selectedOptions: node.selectedOptions ?? [],
  };
}

/** Lens Master optical metafields, flattened. */
function toOptical(product: ShopifyAdminProduct): Record<string, string> {
  const out: Record<string, string> = {};
  for (const { node } of product.metafields?.edges ?? []) out[node.key] = node.value;
  return out;
}

export function toStorefrontProduct(product: ShopifyAdminProduct): ShopifyProduct {
  const variants = (product.variants?.edges ?? []).map((e) => toVariant(e.node));
  const images = (product.images?.edges ?? []).map((e) => e.node);
  if (!images.length && product.featuredImage) images.push(product.featuredImage);

  const prices = variants.map((v) => parseFloat(v.price.amount)).filter((n) => !Number.isNaN(n));
  const minPrice = prices.length
    ? Math.min(...prices)
    : parseFloat(product.priceRangeV2?.minVariantPrice?.amount ?? "0");
  const compareAt = variants
    .map((v) => (v.compareAtPrice ? parseFloat(v.compareAtPrice.amount) : 0))
    .reduce((a, b) => Math.max(a, b), 0);

  return {
    node: {
      id: product.id,
      title: product.title,
      description: product.description ?? "",
      descriptionHtml: product.descriptionHtml ?? "",
      handle: product.handle,
      vendor: product.vendor ?? "",
      productType: product.productType ?? "",
      status: product.status ?? "ACTIVE",
      tags: product.tags ?? [],
      optical: toOptical(product),
      totalInventory: product.totalInventory ?? null,
      availableForSale: variants.some((v) => v.availableForSale),
      priceRange: { minVariantPrice: { amount: String(minPrice), currencyCode: "INR" } },
      compareAtPrice: compareAt > minPrice ? { amount: String(compareAt), currencyCode: "INR" } : null,
      images: { edges: images.map((node) => ({ node })) },
      variants: { edges: variants.map((node) => ({ node })) },
      options: product.options ?? [],
    },
  };
}
