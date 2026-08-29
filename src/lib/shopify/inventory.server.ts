/** Shopify inventory reads + server-side availability validation. */
import { shopifyGraphQL } from "./client.server";

export type StockLevel = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

const LOW_STOCK_THRESHOLD = 5;

export interface VariantAvailability {
  variantId: string;
  productId: string;
  title: string;
  productTitle: string;
  productTags: string[];
  price: string;
  currencyCode: string;
  availableForSale: boolean;
  inventoryQuantity: number | null;
  continueSelling: boolean;
  stockLevel: StockLevel;
}

const VARIANTS_QUERY = `
  query LmVariants($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on ProductVariant {
        id
        title
        price
        availableForSale
        inventoryQuantity
        inventoryPolicy
        product { id title tags }
      }
    }
  }
`;

export function stockLevelFor(quantity: number | null, availableForSale: boolean): StockLevel {
  if (!availableForSale) return "OUT_OF_STOCK";
  if (quantity === null) return "IN_STOCK";
  if (quantity <= 0) return "OUT_OF_STOCK";
  if (quantity <= LOW_STOCK_THRESHOLD) return "LOW_STOCK";
  return "IN_STOCK";
}

/** Authoritative variant state straight from Shopify. Never trust the browser. */
export async function getVariantAvailability(variantIds: string[]): Promise<VariantAvailability[]> {
  const ids = variantIds
    .filter(Boolean)
    .slice(0, 50)
    .map((id) => (id.startsWith("gid://") ? id : `gid://shopify/ProductVariant/${id}`));
  if (!ids.length) return [];

  const data = await shopifyGraphQL<{
    nodes: Array<{
      id: string;
      title: string;
      price: string;
      availableForSale: boolean;
      inventoryQuantity: number | null;
      inventoryPolicy: string;
      product: { id: string; title: string; tags: string[] };
    } | null>;
  }>(VARIANTS_QUERY, { ids });

  return data.nodes
    .filter((n): n is NonNullable<typeof n> => Boolean(n))
    .map((n) => ({
      variantId: n.id,
      productId: n.product.id,
      title: n.title,
      productTitle: n.product.title,
      productTags: n.product.tags ?? [],
      price: n.price,
      currencyCode: "INR",
      availableForSale: n.availableForSale,
      inventoryQuantity: n.inventoryQuantity,
      continueSelling: n.inventoryPolicy === "CONTINUE",
      stockLevel: stockLevelFor(n.inventoryQuantity, n.availableForSale),
    }));
}

export interface CartLineRequest {
  variantId: string;
  quantity: number;
}

export interface InventoryValidationResult {
  ok: boolean;
  issues: Array<{ variantId: string; reason: "NOT_FOUND" | "UNAVAILABLE" | "INSUFFICIENT_STOCK" }>;
  lines: VariantAvailability[];
}

/** Validate requested cart lines against live Shopify inventory. */
export async function validateInventory(lines: CartLineRequest[]): Promise<InventoryValidationResult> {
  const availability = await getVariantAvailability(lines.map((l) => l.variantId));
  const byId = new Map(availability.map((a) => [a.variantId, a]));
  const issues: InventoryValidationResult["issues"] = [];

  for (const line of lines) {
    const gid = line.variantId.startsWith("gid://")
      ? line.variantId
      : `gid://shopify/ProductVariant/${line.variantId}`;
    const variant = byId.get(gid);
    if (!variant) {
      issues.push({ variantId: line.variantId, reason: "NOT_FOUND" });
      continue;
    }
    if (!variant.availableForSale) {
      issues.push({ variantId: line.variantId, reason: "UNAVAILABLE" });
      continue;
    }
    if (
      !variant.continueSelling &&
      variant.inventoryQuantity !== null &&
      variant.inventoryQuantity < line.quantity
    ) {
      issues.push({ variantId: line.variantId, reason: "INSUFFICIENT_STOCK" });
    }
  }

  return { ok: issues.length === 0, issues, lines: availability };
}
