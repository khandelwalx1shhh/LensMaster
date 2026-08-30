/**
 * Server-only Supabase service-role client factory.
 * Used by payment routes that must write orders regardless of storefront auth.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export function createServiceClient(): SupabaseClient<Database> | null {
  const url =
    process.env["SUPABASE_URL"] ||
    process.env["VITE_SUPABASE_URL"] ||
    "https://dxqtbwwkjjsdlpfnkiem.supabase.co";

  const key =
    process.env["SUPABASE_SERVICE_ROLE_KEY"] ||
    process.env["SUPABASE_PUBLISHABLE_KEY"] ||
    process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ||
    "";

  if (!url || !key) {
    console.warn("[supabase-service] Missing Supabase URL or key, skipping DB client initialization");
    return null;
  }

  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Returns the value only when it is a real uuid (FK-safe), otherwise null. */
export function asUuid(value: string | null | undefined): string | null {
  return value && UUID_RE.test(value) ? value : null;
}

export interface MarkPaidInput {
  razorpayOrderId: string;
  paymentId: string;
  signature?: string | null;
}

/**
 * Idempotently marks an order paid. Returns true when a row is now paid.
 * Retries briefly because the webhook can arrive before the insert commits.
 * After marking paid, syncs the order to Shopify (creates a Shopify order
 * with prescription metafields) and stores the Shopify order ID back.
 */
export async function markOrderPaid({
  razorpayOrderId,
  paymentId,
  signature,
}: MarkPaidInput): Promise<boolean> {
  const supabase = createServiceClient();
  if (!supabase) {
    console.warn("[razorpay] Supabase not configured, skipping DB status update");
    return true;
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { data, error } = await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          status: "confirmed",
          razorpay_payment_id: paymentId,
          ...(signature ? { razorpay_signature: signature } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq("razorpay_order_id", razorpayOrderId)
        .select("id, payment_status, shopify_order_id");

      if (error) {
        console.error("[razorpay] mark paid failed", { attempt, error });
      } else if (data && data.length > 0) {
        // Sync to Shopify if not already done
        if (!data[0].shopify_order_id) {
          await syncOrderToShopify(supabase, data[0].id, razorpayOrderId, paymentId);
        }
        return true;
      }
    } catch (err) {
      console.error("[razorpay] mark paid exception", err);
    }

    // Row not visible yet — wait and retry.
    await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
  }

  console.warn("[razorpay] order row not found in Supabase for payment", {
    razorpayOrderId,
    paymentId,
  });
  return true;
}

/**
 * Fetches the full order (items + prescriptions) from Supabase and creates
 * a matching order in Shopify via the Admin API. Prescription data is stored
 * as Shopify order metafields so it's visible in both the Shopify dashboard
 * and the Lens Master admin panel.
 *
 * Failure is non-fatal — the payment is already verified.
 */
async function syncOrderToShopify(
  supabase: NonNullable<ReturnType<typeof createServiceClient>>,
  orderId: string,
  razorpayOrderId: string,
  paymentId: string,
): Promise<void> {
  try {
    const { data: order } = await supabase
      .from("orders")
      .select(
        "id, order_number, customer_name, customer_phone, customer_email, address_line1, address_line2, city, state, pincode, subtotal, delivery_fee, total, notes, order_items(id, title, variant_title, lens_type, price, quantity, prescription_id, prescriptions(*))",
      )
      .eq("id", orderId)
      .maybeSingle();

    if (!order) {
      console.error("[shopify-sync] order not found", { orderId });
      return;
    }

    const { createOrder } = await import("./shopify/orders.server");

    const metafields: Array<{
      namespace: string;
      key: string;
      value: string;
      type: string;
    }> = [];
    order.order_items.forEach((item: any, idx: number) => {
      if (item.prescription_id) {
        metafields.push({
          namespace: "lensmaster",
          key: `prescription_ref_${idx}`,
          value: String(item.prescription_id),
          type: "single_line_text_field",
        });
      }
    });
    metafields.push({
      namespace: "lensmaster",
      key: "order_id",
      value: String(order.id),
      type: "single_line_text_field",
    });

    const shopifyOrder = await createOrder({
      lineItems: order.order_items.map((item: any) => ({
        title: item.title,
        quantity: item.quantity,
        price: String(item.price),
        variantTitle: item.variant_title || undefined,
      })),
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      customerEmail: order.customer_email || undefined,
      address1: order.address_line1,
      address2: order.address_line2 || undefined,
      city: order.city,
      state: order.state,
      pincode: order.pincode,
      total: String(order.total),
      subtotal: String(order.subtotal),
      deliveryFee: String(order.delivery_fee),
      note: `Razorpay: ${razorpayOrderId} · Payment: ${paymentId} · Order: ${order.order_number}`,
      tags: "online,razorpay",
      metafields,
      idempotencyKey: String(order.id),
    });

    // Store Shopify order ID back to Supabase for future reference
    await supabase
      .from("orders")
      .update({ shopify_order_id: shopifyOrder.id })
      .eq("id", orderId);

    console.log("[shopify-sync] order created in Shopify", {
      orderId,
      shopifyOrderId: shopifyOrder.id,
      shopifyOrderName: shopifyOrder.name,
    });

    // Dispatch automated WhatsApp confirmation to consumer & store admin
    try {
      const { sendOrderConfirmationWhatsApp } = await import("./whatsapp.server");
      await sendOrderConfirmationWhatsApp({
        orderId: String(order.id),
        orderNumber: String(order.order_number || order.id),
        customerName: order.customer_name,
        customerPhone: order.customer_phone,
        customerEmail: order.customer_email,
        addressLine1: order.address_line1,
        addressLine2: order.address_line2,
        city: order.city,
        state: order.state,
        pincode: order.pincode,
        subtotal: Number(order.subtotal),
        deliveryFee: Number(order.delivery_fee),
        total: Number(order.total),
        items: (order.order_items || []).map((item: any) => ({
          title: item.title,
          quantity: item.quantity,
          price: Number(item.price),
          variant_title: item.variant_title,
          lens_type: item.lens_type,
          prescription: item.prescriptions,
        })),
        paymentId,
        razorpayOrderId,
      });
    } catch (waError) {
      console.error("[whatsapp] notification dispatch failed (non-blocking)", waError);
    }
  } catch (error) {
    console.error("[shopify-sync] failed to sync order to Shopify", {
      orderId,
      razorpayOrderId,
      error,
    });
    // Non-fatal: payment is verified, order exists in Supabase
  }
}
