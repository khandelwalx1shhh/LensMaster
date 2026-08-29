/**
 * Pure transform functions — Shopify Admin API data → admin row types.
 * Client-safe (no server imports) so it can be imported at module scope
 * in admin.functions.ts.
 */
import type {
  AdminProductRow,
  AdminOrderRow,
  AdminOrderItem,
  AdminPrescription,
} from "../admin-orders.types";

export function shopifyIdFromGid(gid: string): string {
  const match = gid.match(/\/(\d+)$/);
  return match ? match[1] : gid;
}

export function mapFulfillmentStatus(
  status: string,
  financialStatus: string,
  tags: string[],
): string {
  const lowerTags = tags.map((t) => t.toLowerCase());
  if (lowerTags.includes("cancelled") || status === "CANCELLED") return "cancelled";
  if (lowerTags.includes("delivered")) return "delivered";
  if (status === "FULFILLED") return "shipped";
  if (status === "PARTIALLY_FULFILLED") return "processing";
  if (financialStatus === "PAID") return "confirmed";
  return "pending";
}

export function mapFinancialStatus(status: string): string {
  switch (status) {
    case "PAID":
      return "paid";
    case "REFUNDED":
      return "refunded";
    case "VOIDED":
      return "failed";
    case "PARTIALLY_PAID":
      return "pending";
    default:
      return "pending";
  }
}

export function transformProduct(raw: any): AdminProductRow {
  return {
    id: raw.id,
    title: raw.title,
    handle: raw.handle,
    description: raw.description ?? "",
    productType: raw.productType ?? "",
    vendor: raw.vendor ?? "",
    status: (raw.status ?? "ACTIVE").toLowerCase(),
    tags: raw.tags ?? [],
    price: raw.priceRange?.minVariantPrice?.amount ?? "0",
    totalInventory: raw.totalInventory ?? 0,
    image: raw.images?.edges?.[0]?.node?.url ?? null,
    variants: (raw.variants?.edges ?? []).map((e: any) => ({
      id: e.node.id,
      title: e.node.title,
      price: e.node.price,
      compareAtPrice: e.node.compareAtPrice,
      inventoryQuantity: e.node.inventoryQuantity,
    })),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export function transformOrder(raw: any): AdminOrderRow {
  const tags = raw.tags ?? [];
  const financialStatus = raw.financialStatus ?? "PENDING";
  const fulfillmentStatus = raw.fulfillmentStatus ?? "UNFULFILLED";

  const metafields = raw.metafields?.edges ?? [];
  const prescriptions: Record<string, AdminPrescription> = {};
  for (const edge of metafields) {
    try {
      prescriptions[edge.node.key] = JSON.parse(edge.node.value);
    } catch {
      /* skip unparseable */
    }
  }

  const lineItems: AdminOrderItem[] = (raw.lineItems?.edges ?? []).map(
    (edge: any, idx: number) => {
      const node = edge.node;
      return {
        id: node.id,
        title: node.title,
        variantTitle: node.variantTitle,
        quantity: node.quantity,
        price: parseFloat(node.originalUnitPriceSet?.shopMoney?.amount ?? "0"),
        prescription: prescriptions[`item_${idx}`] ?? null,
      };
    },
  );

  const customer = raw.customer;
  const shippingAddress = raw.shippingAddress;

  return {
    id: raw.id,
    orderNumber: raw.name ?? `#${raw.orderNumber}`,
    status: mapFulfillmentStatus(fulfillmentStatus, financialStatus, tags),
    paymentStatus: mapFinancialStatus(financialStatus),
    fulfillmentStatus,
    financialStatus,
    customerName: customer
      ? `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim() || "Guest"
      : "Guest",
    customerPhone: customer?.phone ?? shippingAddress?.phone ?? null,
    customerEmail: customer?.email ?? null,
    address1: shippingAddress?.address1 ?? "",
    address2: shippingAddress?.address2 ?? null,
    city: shippingAddress?.city ?? "",
    state: shippingAddress?.province ?? "",
    pincode: shippingAddress?.zip ?? "",
    subtotal: parseFloat(raw.subtotalPriceSet?.shopMoney?.amount ?? "0"),
    deliveryFee: parseFloat(raw.totalShippingPriceSet?.shopMoney?.amount ?? "0"),
    total: parseFloat(raw.totalPriceSet?.shopMoney?.amount ?? "0"),
    lineItems,
    tags,
    note: raw.note ?? null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt ?? raw.createdAt,
    processedAt: raw.processedAt ?? raw.createdAt,
  };
}
