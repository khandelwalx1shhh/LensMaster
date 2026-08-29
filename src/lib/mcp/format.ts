/** Shared shaping helpers for MCP tool responses. */
import type { ShopifyAdminProduct } from "@/lib/shopify/products.server";

export function variantStock(v: {
  availableForSale: boolean;
  inventoryQuantity: number | null;
  inventoryPolicy: string;
  inventoryItem?: { tracked: boolean } | null;
}) {
  const tracked = v.inventoryItem?.tracked ?? true;
  const continueSelling = v.inventoryPolicy?.toUpperCase() === "CONTINUE";
  if (!tracked || continueSelling) return v.availableForSale ? "IN_STOCK" : "OUT_OF_STOCK";
  const qty = v.inventoryQuantity ?? 0;
  if (qty <= 0) return "OUT_OF_STOCK";
  if (qty <= 5) return "LOW_STOCK";
  return "IN_STOCK";
}

export function toSummary(p: ShopifyAdminProduct) {
  const variants = p.variants?.edges?.map((e) => e.node) ?? [];
  return {
    id: p.id,
    handle: p.handle,
    title: p.title,
    vendor: p.vendor,
    productType: p.productType,
    tags: p.tags,
    price: p.priceRangeV2?.minVariantPrice?.amount ?? null,
    currency: p.priceRangeV2?.minVariantPrice?.currencyCode ?? "INR",
    image: p.featuredImage?.url ?? null,
    stock: variants.some((v) => variantStock(v) !== "OUT_OF_STOCK") ? "IN_STOCK" : "OUT_OF_STOCK",
  };
}

export function toDetail(p: ShopifyAdminProduct) {
  const metafields: Record<string, string> = {};
  for (const { node } of p.metafields?.edges ?? []) metafields[node.key] = node.value;
  return {
    ...toSummary(p),
    description: p.description,
    options: p.options,
    images: (p.images?.edges ?? []).map((e) => e.node.url),
    metafields,
    variants: (p.variants?.edges ?? []).map((e) => ({
      id: e.node.id,
      title: e.node.title,
      sku: e.node.sku,
      price: e.node.price,
      compareAtPrice: e.node.compareAtPrice,
      selectedOptions: e.node.selectedOptions,
      stock: variantStock(e.node),
      inventoryQuantity: e.node.inventoryQuantity,
    })),
  };
}
