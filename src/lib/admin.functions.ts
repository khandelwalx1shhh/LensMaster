/**
 * Admin server functions — Shopify is the source of truth for products,
 * variants, pricing and inventory; Lovable Cloud stores orders and encrypted
 * prescriptions. Uses the service-role client to bypass RLS so admins see every row
 * regardless of status. Admin auth, audit logs, and CSRF remain enforced.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireAdmin, logAudit } from "./admin/security.server";
import { db } from "./admin/security.server";
import type {
  AdminProductRow,
  AdminProductVariant,
  AdminOrderRow,
  AdminOrderItem,
  AdminPrescription,
} from "./admin-orders.types";

/* ----------------------------------------------------------- helpers */

/** Load service-role Supabase client inside the handler (never at module scope). */
async function adminDb() {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return supabaseAdmin;
  } catch {
    const { createServiceClient } = await import("@/lib/supabase-service.server");
    return createServiceClient();
  }
}

/* ----------------------------------------------------------- products */

/* ----------------------------------------------------------- orders */

function mapOrderRow(
  o: any,
  items: any[],
  prescriptions: Map<string, AdminPrescription>,
): AdminOrderRow {
  const lineItems: AdminOrderItem[] = items.map((item) => ({
    id: item.id,
    title: item.title,
    variantTitle: item.variant_title ?? null,
    quantity: item.quantity ?? 1,
    price: Number(item.price ?? 0),
    prescription: prescriptions.get(item.id) ?? null,
  }));

  const status: string = o.status ?? "pending";
  const paymentStatus: string = o.payment_status ?? "pending";

  return {
    id: o.id,
    orderNumber: o.order_number ?? `#${o.id.slice(0, 8)}`,
    status,
    paymentStatus,
    fulfillmentStatus: status === "delivered" ? "FULFILLED" : "UNFULFILLED",
    financialStatus: paymentStatus === "paid" ? "PAID" : "PENDING",
    customerName: o.customer_name ?? "Guest",
    customerPhone: o.customer_phone ?? null,
    customerEmail: o.customer_email ?? null,
    address1: o.address_line1 ?? "",
    address2: o.address_line2 ?? null,
    city: o.city ?? "",
    state: o.state ?? "",
    pincode: o.pincode ?? "",
    subtotal: Number(o.subtotal ?? 0),
    deliveryFee: Number(o.delivery_fee ?? 99),
    total: Number(o.total ?? 0),
    lineItems,
    tags: [],
    note: o.notes ?? null,
    createdAt: o.created_at,
    updatedAt: o.updated_at ?? o.created_at,
    processedAt: o.created_at,
  };
}

/* ----------------------------------------------------------- server fns */

export const getAdminStats = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin("dashboard.view");
  try {
    const client = await adminDb();

    const { listProducts } = await import("./shopify/products.server");
    const [shopifyProducts, dbOrders] = await Promise.all([
      listProducts({ first: 250 }).catch((err) => {
        console.error("[admin] Shopify product count failed", err);
        return { products: [] as unknown[] };
      }),
      client
        ? client
            .from("orders")
            .select("*", { count: "exact" })
            .order("created_at", { ascending: false })
            .limit(250)
            .catch(() => ({ data: null, count: 0 }))
        : Promise.resolve({ data: null, count: 0 }),
    ]);
    const productCount = shopifyProducts.products.length;
    const orders = dbOrders?.data ?? [];
    const orderCount = dbOrders?.count ?? orders.length;

    const paidOrders = orders.filter((o) => o.payment_status === "paid");
    const revenue = paidOrders.reduce((sum, o) => sum + Number(o.total ?? 0), 0);
    const customerEmails = new Set(orders.map((o) => o.customer_email).filter(Boolean));

    const recentOrders = orders.slice(0, 5).map((o) => ({
      id: o.id,
      orderNumber: o.order_number ?? `#${o.id.slice(0, 8)}`,
      customerName: o.customer_name ?? "Guest",
      total: Number(o.total ?? 0),
      status: o.status ?? "pending",
      createdAt: o.created_at,
    }));

    return {
      productCount: productCount ?? 0,
      orderCount: orderCount ?? 0,
      customerCount: customerEmails.size,
      revenue,
      recentOrders,
    };
  } catch (error) {
    console.error("[admin] stats fetch failed", error);
    return {
      productCount: 0,
      orderCount: 0,
      customerCount: 0,
      revenue: 0,
      recentOrders: [],
    };
  }
});

export const getAdminProducts = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin("products.view");
  const { listProducts } = await import("./shopify/products.server");
  const page = await listProducts({ first: 250 });

  return page.products.map((p): AdminProductRow => {
    const variants = (p.variants?.edges ?? []).map((e) => e.node);
    return {
      id: p.id,
      title: p.title,
      handle: p.handle,
      description: p.description ?? "",
      productType: p.productType ?? "",
      vendor: p.vendor ?? "Lens Master",
      status: (p.status ?? "ACTIVE").toLowerCase(),
      tags: p.tags ?? [],
      price: String(variants[0]?.price ?? p.priceRangeV2?.minVariantPrice?.amount ?? "0"),
      totalInventory:
        p.totalInventory ??
        variants.reduce((sum, v) => sum + (v.inventoryQuantity ?? 0), 0),
      image: p.featuredImage?.url ?? p.images?.edges?.[0]?.node?.url ?? null,
      variants: variants.map((v): AdminProductVariant => ({
        id: v.id,
        title: v.title,
        price: String(v.price ?? "0"),
        compareAtPrice: v.compareAtPrice ? String(v.compareAtPrice) : null,
        inventoryQuantity: v.inventoryQuantity ?? 0,
      })),
      createdAt: p.createdAt ?? new Date().toISOString(),
      updatedAt: p.updatedAt ?? p.createdAt ?? new Date().toISOString(),
    };
  });
});

export const getAdminOrders = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin("orders.view");
  try {
    const client = await adminDb();
    if (!client) return [] as AdminOrderRow[];

    const { data: orders } = await client
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(250);

    if (!orders?.length) {
      // Fallback: list orders from Shopify Admin API
      try {
        const { listOrders } = await import("./shopify/orders.server");
        const shopifyRes = await listOrders({ first: 100 });
        if (shopifyRes.orders && shopifyRes.orders.length > 0) {
          return shopifyRes.orders.map((so: any): AdminOrderRow => ({
            id: so.id.split("/").pop() ?? so.id,
            orderNumber: so.name,
            status: so.fulfillment_status === "FULFILLED" ? "delivered" : "processing",
            paymentStatus: so.financial_status === "PAID" ? "paid" : "pending",
            fulfillmentStatus: so.fulfillment_status ?? "UNFULFILLED",
            financialStatus: so.financial_status ?? "PAID",
            customerName: `${so.customer?.first_name || ""} ${so.customer?.last_name || ""}`.trim() || "Customer",
            customerPhone: so.customer?.phone ?? null,
            customerEmail: so.customer?.email ?? null,
            address1: so.shipping_address?.address1 ?? "",
            address2: so.shipping_address?.address2 ?? null,
            city: so.shipping_address?.city ?? "",
            state: so.shipping_address?.province ?? "",
            pincode: so.shipping_address?.zip ?? "",
            subtotal: Number(so.subtotal ?? 0),
            deliveryFee: 99,
            total: Number(so.total ?? 0),
            lineItems: (so.line_items || []).map((li: any) => ({
              id: String(li.id),
              title: li.title,
              variantTitle: li.variant_title ?? null,
              quantity: li.quantity ?? 1,
              price: Number(li.price ?? 0),
              prescription: null,
            })),
            tags: so.tags ? so.tags.split(", ") : [],
            note: so.note ?? null,
            createdAt: so.processed_at || new Date().toISOString(),
            updatedAt: so.processed_at || new Date().toISOString(),
            processedAt: so.processed_at || new Date().toISOString(),
          }));
        }
      } catch (shopifyErr) {
        console.warn("[admin] Shopify fallback order fetch skipped", shopifyErr);
      }
      return [] as AdminOrderRow[];
    }

    const orderIds = orders.map((o) => o.id);
    const { data: items } = await client
      .from("order_items")
      .select("*")
      .in("order_id", orderIds)
      .order("created_at", { ascending: true });

    const itemsMap = new Map<string, any[]>();
    for (const item of items ?? []) {
      const arr = itemsMap.get(item.order_id) ?? [];
      arr.push(item);
      itemsMap.set(item.order_id, arr);
    }

    // Load prescriptions linked to order items
    const prescriptionIds = (items ?? [])
      .map((i) => i.prescription_id)
      .filter(Boolean) as string[];
    let prescriptions: Record<string, AdminPrescription> = {};
    if (prescriptionIds.length) {
      const { data: rxRows } = await client
        .from("prescriptions")
        .select("*")
        .in("id", prescriptionIds);
      for (const rx of rxRows ?? []) {
        prescriptions[rx.id] = {
          product_type: rx.product_type,
          right_sph: rx.right_sph,
          right_cyl: rx.right_cyl,
          right_axis: rx.right_axis,
          right_add: rx.right_add,
          left_sph: rx.left_sph,
          left_cyl: rx.left_cyl,
          left_axis: rx.left_axis,
          left_add: rx.left_add,
          pd: rx.pd,
          pd_type: rx.pd_type,
          right_pd: rx.right_pd,
          left_pd: rx.left_pd,
          photo_url: rx.photo_url,
          notes: rx.notes,
        };
      }
    }

    // Map prescription to each order item by prescription_id
    const itemRxMap = new Map<string, AdminPrescription>();
    for (const item of items ?? []) {
      if (item.prescription_id && prescriptions[item.prescription_id]) {
        itemRxMap.set(item.id, prescriptions[item.prescription_id]);
      }
    }

    return orders.map((o) =>
      mapOrderRow(o, itemsMap.get(o.id) ?? [], itemRxMap),
    ) as AdminOrderRow[];
  } catch (error) {
    console.error("[admin] orders fetch failed", error);
    return [] as AdminOrderRow[];
  }
});

export const updateOrderStatus = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      orderId: string;
      status: string;
      csrfToken: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    const ctx = await requireAdmin("orders.manage");
    const { requireCsrf } = await import("./admin/security.server");
    await requireCsrf(ctx, data?.csrfToken ?? "");

    const ALLOWED = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
    if (!ALLOWED.includes(data.status)) throw new Error("ADMIN_UPDATE_FAILED");

    const client = await adminDb();
    const { error } = await client
      .from("orders")
      .update({ status: data.status, updated_at: new Date().toISOString() })
      .eq("id", data.orderId);

    if (error) {
      console.error("[admin] order status update failed", error);
      throw new Error("ADMIN_UPDATE_FAILED");
    }

    await logAudit({
      adminUserId: ctx.userId,
      actorEmail: ctx.email,
      action: "Order status updated",
      module: "orders",
      entityType: "order",
      entityId: data.orderId,
      entityLabel: data.orderId.slice(0, 8),
      next: { status: data.status },
    });

    return { ok: true };
  });

export const createProduct = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      title: string;
      description?: string;
      productType?: string;
      vendor?: string;
      tags?: string;
      price?: string;
      csrfToken: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    const ctx = await requireAdmin("products.create");
    const { requireCsrf } = await import("./admin/security.server");
    await requireCsrf(ctx, data?.csrfToken ?? "");

    const client = await adminDb();
    const handle = (data.title || "product")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const { data: product, error } = await client
      .from("products")
      .insert({
        title: data.title,
        handle,
        description: data.description || null,
        product_type: data.productType || "Optical Frame",
        brand: data.vendor || "Lens Master",
        tags: data.tags ? data.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        base_price: Number(data.price || 0),
        status: "active",
      })
      .select()
      .single();

    if (error || !product) {
      console.error("[admin] product create failed", error);
      throw new Error("ADMIN_CREATE_FAILED");
    }

    // Create a default variant
    await client.from("product_variants").insert({
      product_id: product.id,
      title: "Default",
      price: Number(data.price || 0),
      inventory_quantity: 0,
    });

    await logAudit({
      adminUserId: ctx.userId,
      actorEmail: ctx.email,
      action: "Product created",
      module: "products",
      entityType: "product",
      entityId: product.id,
      entityLabel: data.title,
      next: { title: data.title, price: data.price },
    });

    return { ok: true, id: product.id };
  });

export const updateProduct = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      productId: string;
      title?: string;
      description?: string;
      productType?: string;
      vendor?: string;
      tags?: string;
      price?: string;
      csrfToken: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    const ctx = await requireAdmin("products.edit");
    const { requireCsrf } = await import("./admin/security.server");
    await requireCsrf(ctx, data?.csrfToken ?? "");

    const update: Record<string, any> = { updated_at: new Date().toISOString() };
    if (data.title) update.title = data.title;
    if (data.description !== undefined) update.description = data.description;
    if (data.productType) update.product_type = data.productType;
    if (data.vendor) update.brand = data.vendor;
    if (data.tags) update.tags = data.tags.split(",").map((t) => t.trim()).filter(Boolean);
    if (data.price) update.base_price = Number(data.price);

    const client = await adminDb();
    const { error } = await client.from("products").update(update as any).eq("id", data.productId);

    if (error) {
      console.error("[admin] product update failed", error);
      throw new Error("ADMIN_UPDATE_FAILED");
    }

    // Update default variant price if provided
    if (data.price) {
      await client
        .from("product_variants")
        .update({ price: Number(data.price) })
        .eq("product_id", data.productId)
        .eq("title", "Default");
    }

    await logAudit({
      adminUserId: ctx.userId,
      actorEmail: ctx.email,
      action: "Product updated",
      module: "products",
      entityType: "product",
      entityId: data.productId,
      entityLabel: data.title ?? "",
      next: update,
    });

    return { ok: true };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      productId: string;
      csrfToken: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    const ctx = await requireAdmin("products.archive");
    const { requireCsrf } = await import("./admin/security.server");
    await requireCsrf(ctx, data?.csrfToken ?? "");

    const client = await adminDb();
    // Soft-delete: set status to archived
    const { error } = await client
      .from("products")
      .update({ status: "archived", updated_at: new Date().toISOString() })
      .eq("id", data.productId);

    if (error) {
      console.error("[admin] product archive failed", error);
      throw new Error("ADMIN_DELETE_FAILED");
    }

    await logAudit({
      adminUserId: ctx.userId,
      actorEmail: ctx.email,
      action: "Product archived",
      module: "products",
      entityType: "product",
      entityId: data.productId,
    });

    return { ok: true };
  });
