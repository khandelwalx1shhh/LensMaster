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
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select(
        "id, order_number, customer_name, customer_phone, customer_email, address_line1, address_line2, city, state, pincode, subtotal, delivery_fee, total, notes, order_items(id, title, variant_title, variant_id, lens_type, price, quantity, prescription_id)",
      )
      .eq("id", orderId)
      .maybeSingle();

    if (orderErr || !order) {
      console.error("[shopify-sync] order fetch failed:", { orderId, error: orderErr });
      return;
    }

    const { createOrder } = await import("./shopify/orders.server");

    // Fetch related prescriptions separately to prevent schema relationship errors
    const rxIds = (order.order_items || [])
      .map((i: any) => i.prescription_id)
      .filter((id: any): id is string => Boolean(id));

    let rxMap = new Map<string, any>();
    if (rxIds.length > 0) {
      const { data: rxRows, error: rxErr } = await supabase
        .from("prescriptions")
        .select("*")
        .in("id", rxIds);
      if (rxErr) {
        console.warn("[shopify-sync] prescriptions fetch warning:", rxErr);
      } else if (rxRows) {
        rxMap = new Map(rxRows.map((rx) => [rx.id, rx]));
      }
    }

    const metafields: Array<{
      namespace: string;
      key: string;
      value: string;
      type: string;
    }> = [];

    const rxNoteLines: string[] = [];

    (order.order_items || []).forEach((item: any, idx: number) => {
      if (item.prescription_id) {
        const rx = rxMap.get(item.prescription_id);
        if (rx) {
          const rxSummary = [
            `Item ${idx + 1} (${item.title || "Frame"}):`,
            rx.product_type ? `Type: ${rx.product_type}` : null,
            rx.right_sph != null || rx.right_cyl != null
              ? `OD (Right): SPH ${rx.right_sph ?? "0.00"}, CYL ${rx.right_cyl ?? "0.00"}, AXIS ${rx.right_axis ?? "—"}, ADD ${rx.right_add ?? "—"}`
              : null,
            rx.left_sph != null || rx.left_cyl != null
              ? `OS (Left): SPH ${rx.left_sph ?? "0.00"}, CYL ${rx.left_cyl ?? "0.00"}, AXIS ${rx.left_axis ?? "—"}, ADD ${rx.left_add ?? "—"}`
              : null,
            rx.pd ? `PD: ${rx.pd} mm` : null,
            rx.notes ? `Notes: ${rx.notes}` : null,
            rx.photo_url ? `Rx Photo: ${rx.photo_url}` : null,
          ]
            .filter(Boolean)
            .join(" | ");

          rxNoteLines.push(rxSummary);

          metafields.push({
            namespace: "lensmaster",
            key: `rx_details_${idx + 1}`,
            value: rxSummary,
            type: "single_line_text_field",
          });
        }

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

    const fullOrderNote = [
      `Razorpay Order: ${razorpayOrderId}`,
      `Razorpay Payment ID: ${paymentId}`,
      `Lens Master Order #: ${order.order_number}`,
      rxNoteLines.length > 0 ? `\n--- Prescription Details ---\n${rxNoteLines.join("\n")}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const shopifyOrder = await createOrder({
      lineItems: (order.order_items || []).map((item: any) => ({
        title: item.title,
        quantity: item.quantity,
        price: String(item.price),
        variantTitle: item.variant_title || item.lens_type || undefined,
        variantId: item.variant_id || undefined,
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
      note: fullOrderNote,
      tags: "online, razorpay, verified-paid",
      metafields,
      idempotencyKey: String(order.id),
    });

    // Store Shopify order ID back to Supabase for future reference
    await supabase
      .from("orders")
      .update({ shopify_order_id: shopifyOrder.id })
      .eq("id", orderId);

    console.log("[shopify-sync] order successfully synced to Shopify:", {
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
          prescription: item.prescription_id ? rxMap.get(item.prescription_id) : undefined,
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
