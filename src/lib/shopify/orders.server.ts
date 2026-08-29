/** Shopify order reads + order creation (post payment verification). */
import { shopifyGraphQL, shopifyREST } from "./client.server";

const ORDER_FIELDS = `
  id
  name
  createdAt
  processedAt
  displayFinancialStatus
  displayFulfillmentStatus
  note
  tags
  totalPriceSet { shopMoney { amount currencyCode } }
  subtotalPriceSet { shopMoney { amount } }
  totalShippingPriceSet { shopMoney { amount } }
  customer { firstName lastName email phone }
  shippingAddress { name address1 address2 city province zip phone }
  lineItems(first: 50) {
    edges {
      node {
        id
        title
        quantity
        variantTitle
        sku
        originalUnitPriceSet { shopMoney { amount } }
      }
    }
  }
  metafields(first: 20, namespace: "lensmaster") { edges { node { key value } } }
`;

export interface ShopifyAdminOrder {
  id: string;
  name: string;
  createdAt: string;
  processedAt: string | null;
  displayFinancialStatus: string;
  displayFulfillmentStatus: string;
  note: string | null;
  tags: string[];
  totalPriceSet: { shopMoney: { amount: string; currencyCode: string } };
  subtotalPriceSet: { shopMoney: { amount: string } };
  totalShippingPriceSet: { shopMoney: { amount: string } };
  customer: { firstName: string; lastName: string; email: string | null; phone: string | null } | null;
  shippingAddress: {
    name: string;
    address1: string;
    address2: string | null;
    city: string;
    province: string;
    zip: string;
    phone: string | null;
  } | null;
  lineItems: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        quantity: number;
        variantTitle: string | null;
        sku: string | null;
        originalUnitPriceSet: { shopMoney: { amount: string } };
      };
    }>;
  };
  metafields: { edges: Array<{ node: { key: string; value: string } }> };
}

const ORDERS_QUERY = `
  query LmOrders($first: Int!, $after: String, $query: String) {
    orders(first: $first, after: $after, query: $query, sortKey: CREATED_AT, reverse: true) {
      edges { node { ${ORDER_FIELDS} } }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

export async function listOrders(opts: { first?: number; after?: string | null; query?: string | null } = {}) {
  const first = Math.min(Math.max(opts.first ?? 25, 1), 100);
  const data = await shopifyGraphQL<{
    orders: {
      edges: Array<{ node: ShopifyAdminOrder }>;
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
    };
  }>(ORDERS_QUERY, { first, after: opts.after ?? null, query: opts.query || null });
  return { orders: data.orders.edges.map((e) => e.node), pageInfo: data.orders.pageInfo };
}

const ORDER_QUERY = `query LmOrder($id: ID!) { order(id: $id) { ${ORDER_FIELDS} } }`;

export async function getOrderById(id: string): Promise<ShopifyAdminOrder | null> {
  const gid = id.startsWith("gid://") ? id : `gid://shopify/Order/${id}`;
  const data = await shopifyGraphQL<{ order: ShopifyAdminOrder | null }>(ORDER_QUERY, { id: gid });
  return data.order;
}

/* ---------- Order creation (called only after verified payment) ---------- */

export interface CreateOrderLineItem {
  title: string;
  quantity: number;
  price: string;
  variantId?: string | null;
  variantTitle?: string;
}

export interface CreateOrderInput {
  lineItems: CreateOrderLineItem[];
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  pincode: string;
  total: string;
  subtotal: string;
  deliveryFee: string;
  note?: string;
  tags?: string;
  /** Non-sensitive references only (e.g. prescription IDs), never raw Rx values. */
  metafields?: Array<{ namespace: string; key: string; value: string; type: string }>;
  /** Idempotency guard — an existing order with this tag is returned as-is. */
  idempotencyKey?: string;
}

export interface CreatedOrder {
  id: string;
  name: string;
  orderNumber: number;
}

async function findOrderByIdempotencyKey(key: string): Promise<CreatedOrder | null> {
  try {
    const { orders } = await listOrders({ first: 1, query: `tag:'lm-${key}'` });
    const found = orders[0];
    if (!found) return null;
    return {
      id: found.id.split("/").pop() ?? found.id,
      name: found.name,
      orderNumber: Number(found.name.replace(/\D/g, "")) || 0,
    };
  } catch {
    return null;
  }
}

export async function createOrder(input: CreateOrderInput): Promise<CreatedOrder> {
  if (input.idempotencyKey) {
    const existing = await findOrderByIdempotencyKey(input.idempotencyKey);
    if (existing) {
      console.info("[shopify] duplicate order creation skipped (idempotent)");
      return existing;
    }
  }

  const [firstName, ...rest] = input.customerName.trim().split(" ");
  const lastName = rest.join(" ");
  const tags = [input.tags || "online", input.idempotencyKey ? `lm-${input.idempotencyKey}` : ""]
    .filter(Boolean)
    .join(", ");

  const body = {
    order: {
      line_items: input.lineItems.map((li) => ({
        ...(li.variantId ? { variant_id: Number(li.variantId.split("/").pop()) } : {}),
        title: li.title,
        quantity: li.quantity,
        price: li.price,
        variant_title: li.variantTitle,
        requires_shipping: true,
        taxable: false,
      })),
      customer: {
        first_name: firstName || input.customerName,
        last_name: lastName,
        phone: input.customerPhone,
        ...(input.customerEmail ? { email: input.customerEmail } : {}),
      },
      shipping_address: {
        first_name: firstName || input.customerName,
        last_name: lastName,
        address1: input.address1,
        address2: input.address2 || "",
        city: input.city,
        province: input.state,
        zip: input.pincode,
        country: "India",
        phone: input.customerPhone,
      },
      shipping_lines: Number(input.deliveryFee) > 0
        ? [{ title: "Delivery", price: input.deliveryFee, code: "STANDARD" }]
        : [],
      financial_status: "paid",
      fulfillment_status: null,
      tags,
      note: input.note || "",
      inventory_behaviour: "decrement_ignoring_policy",
      metafields: input.metafields || [],
    },
  };

  const data = await shopifyREST<{ order: { id: number; name: string; order_number: number } }>(
    "POST",
    "/orders.json",
    body,
  );
  console.info("[shopify] order created");
  return { id: String(data.order.id), name: data.order.name, orderNumber: data.order.order_number };
}

export async function updateOrderNote(orderId: string, note: string) {
  const numericId = orderId.split("/").pop();
  await shopifyREST("PUT", `/orders/${numericId}.json`, { order: { id: Number(numericId), note } });
}

export async function cancelOrder(orderId: string) {
  const numericId = orderId.split("/").pop();
  await shopifyREST("POST", `/orders/${numericId}/cancel.json`, {
    email: false,
    restock: true,
    reason: "other",
  });
}
