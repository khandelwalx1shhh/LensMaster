/**
 * WhatsApp Order Notifications Service
 *
 * Dispatches automated order confirmation and status updates to consumers and store admin
 * when an order is placed and marked PAID.
 *
 * Supports:
 * - Meta WhatsApp Cloud API (Official)
 * - Aisensy / Interakt / Wati / Gallabox (Indian BSP APIs & Webhooks)
 * - Twilio WhatsApp API
 */

import { SITE_URL, STORE_PHONE } from "./seo";

export interface OrderItemSummary {
  title: string;
  quantity: number;
  price: number;
  variant_title?: string | null;
  lens_type?: string | null;
  prescription?: any;
}

export interface OrderNotificationData {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  pincode: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  items: OrderItemSummary[];
  paymentId?: string;
  razorpayOrderId?: string;
}

/** Format standard 10-digit or international phone number to WhatsApp E.164 (e.g., 919829230548) */
export function normalizeWhatsAppNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `91${cleaned}`;
  }
  if (cleaned.startsWith("0") && cleaned.length === 11) {
    return `91${cleaned.slice(1)}`;
  }
  return cleaned;
}

/** Formats customer order confirmation text */
export function formatCustomerOrderMessage(order: OrderNotificationData): string {
  const itemsText = order.items
    .map((item, i) => {
      let line = `${i + 1}. *${item.title}* (Qty: ${item.quantity}) — ₹${item.price * item.quantity}`;
      if (item.variant_title) line += `\n   ↳ _Variant:_ ${item.variant_title}`;
      if (item.lens_type) line += `\n   ↳ _Lens:_ ${item.lens_type}`;
      return line;
    })
    .join("\n");

  return (
    `👓 *Order Confirmed! — Lens Master*\n\n` +
    `Hello *${order.customerName}*,\n` +
    `Thank you for your order! We have received your payment and our Lens Master team is preparing your eyewear.\n\n` +
    `📋 *Order Reference:* \`${order.orderNumber || order.orderId}\`\n` +
    `💰 *Amount Paid:* ₹${order.total.toLocaleString("en-IN")}\n\n` +
    `📦 *Items Ordered:*\n${itemsText}\n\n` +
    `📍 *Delivery Address:*\n${order.addressLine1}${order.addressLine2 ? `, ${order.addressLine2}` : ""}, ${order.city}, ${order.state} — ${order.pincode}\n\n` +
    `💬 *Prescription or Questions?*\n` +
    `Reply directly to this chat or call Lens Master at *${STORE_PHONE}*.\n\n` +
    `_Lens Master — Premium Eyewear_`
  );
}

/** Formats admin alert message for the store owner */
export function formatAdminOrderAlertMessage(order: OrderNotificationData): string {
  const itemsText = order.items
    .map((item) => `• ${item.title} (x${item.quantity}) [₹${item.price}]`)
    .join("\n");

  return (
    `🚨 *NEW ORDER RECEIVED — ₹${order.total.toLocaleString("en-IN")}*\n\n` +
    `👤 *Customer:* ${order.customerName}\n` +
    `📞 *Phone:* +${normalizeWhatsAppNumber(order.customerPhone)}\n` +
    `📋 *Order #:* ${order.orderNumber || order.orderId}\n` +
    `💳 *Payment ID:* ${order.paymentId || "Verified"}\n\n` +
    `📦 *Items:*\n${itemsText}\n\n` +
    `📍 *City:* ${order.city}, ${order.pincode}\n` +
    `🔗 Admin Link: ${SITE_URL}/admin/orders`
  );
}

/**
 * Main dispatcher to send automated WhatsApp messages
 */
export async function sendOrderConfirmationWhatsApp(order: OrderNotificationData): Promise<{
  customerSent: boolean;
  adminSent: boolean;
  error?: string;
}> {
  const provider = (process.env.WHATSAPP_PROVIDER || "").toLowerCase().trim();
  const token = process.env.WHATSAPP_API_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN || "";
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
  const adminPhone = process.env.WHATSAPP_ADMIN_PHONE || "919829230548";

  const customerPhone = normalizeWhatsAppNumber(order.customerPhone);
  const customerMessage = formatCustomerOrderMessage(order);
  const adminMessage = formatAdminOrderAlertMessage(order);

  console.log("[whatsapp] Preparing automated order notification for:", {
    orderId: order.orderId,
    customerPhone,
    provider: provider || "unconfigured",
  });

  let customerSent = false;
  let adminSent = false;

  // 1. Meta WhatsApp Cloud API (Graph API)
  if (provider === "meta" || (phoneId && token)) {
    try {
      customerSent = await sendMetaCloudMessage(phoneId, token, customerPhone, customerMessage);
      if (adminPhone) {
        adminSent = await sendMetaCloudMessage(phoneId, token, adminPhone, adminMessage);
      }
      return { customerSent, adminSent };
    } catch (err: any) {
      console.error("[whatsapp-meta] Dispatch failed:", err);
      return { customerSent: false, adminSent: false, error: err?.message };
    }
  }

  // 2. Generic Webhook (Aisensy, Interakt, Wati, Gallabox, Zapier)
  const webhookUrl = process.env.WHATSAPP_WEBHOOK_URL || process.env.AISENSY_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      const resp = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          event: "order.paid",
          to: customerPhone,
          message: customerMessage,
          adminPhone,
          adminMessage,
          order,
        }),
      });
      customerSent = resp.ok;
      console.log("[whatsapp-webhook] Webhook response status:", resp.status);
      return { customerSent, adminSent: resp.ok };
    } catch (err: any) {
      console.error("[whatsapp-webhook] Webhook failed:", err);
      return { customerSent: false, adminSent: false, error: err?.message };
    }
  }

  // 3. Twilio WhatsApp
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_WHATSAPP_FROM; // e.g. "whatsapp:+14155238886"
  if (twilioSid && twilioAuth && twilioFrom) {
    try {
      customerSent = await sendTwilioMessage(twilioSid, twilioAuth, twilioFrom, customerPhone, customerMessage);
      if (adminPhone) {
        adminSent = await sendTwilioMessage(twilioSid, twilioAuth, twilioFrom, adminPhone, adminMessage);
      }
      return { customerSent, adminSent };
    } catch (err: any) {
      console.error("[whatsapp-twilio] Twilio failed:", err);
      return { customerSent: false, adminSent: false, error: err?.message };
    }
  }

  // Log fallback when credentials aren't yet added to Vercel env
  console.log(
    "[whatsapp] No automated provider configured yet. Add WHATSAPP_API_TOKEN & WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_WEBHOOK_URL to Vercel environment variables to enable automatic direct push.",
  );

  return { customerSent: false, adminSent: false };
}

async function sendMetaCloudMessage(
  phoneId: string,
  token: string,
  to: string,
  text: string,
): Promise<boolean> {
  const url = `https://graph.facebook.com/v21.0/${phoneId}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { preview_url: true, body: text },
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("[whatsapp-meta] API error:", res.status, errorBody);
    return false;
  }
  return true;
}

async function sendTwilioMessage(
  accountSid: string,
  authToken: string,
  from: string,
  to: string,
  body: string,
): Promise<boolean> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const formData = new URLSearchParams();
  formData.append("From", from.startsWith("whatsapp:") ? from : `whatsapp:${from}`);
  formData.append("To", `whatsapp:+${to}`);
  formData.append("Body", body);

  const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${authHeader}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(),
  });

  return res.ok;
}
