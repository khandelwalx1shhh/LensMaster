/**
 * Customer-facing order server functions.
 *
 * Security model (OWASP A01 — Broken Access Control / IDOR):
 * the storefront is a guest-only flow with no customer accounts, so the
 * server cannot trust any client-side identity claim.

 * Therefore:
 *  - An order reference alone returns a REDACTED view (status + totals +
 *    masked contact). No prescription clinical data, no full address.
 *  - The full view requires the order reference AND the mobile number the
 *    order was placed with (verified server-side against the stored row).
 *  - Every lookup is rate limited per IP to stop enumeration.
 */
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { enforceRateLimit } from "./rate-limit.server";

type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];
type PrescriptionRow = Database["public"]["Tables"]["prescriptions"]["Row"];

const PHONE_RE = /^[6-9]\d{9}$/;
const ORDER_NUMBER_RE = /^[A-Za-z0-9_-]{3,60}$/;

function maskPhone(phone: string | null): string {
  if (!phone) return "";
  return phone.length >= 4 ? `${"•".repeat(Math.max(0, phone.length - 4))}${phone.slice(-4)}` : "••••";
}

function maskEmail(email: string | null): string | null {
  if (!email) return null;
  const [user, domain] = email.split("@");
  if (!domain) return null;
  return `${user.slice(0, 1)}${"•".repeat(Math.max(1, user.length - 1))}@${domain}`;
}

function maskName(name: string | null): string {
  if (!name) return "";
  return name
    .split(/\s+/)
    .map((part) => (part ? `${part[0]}${"•".repeat(Math.max(1, part.length - 1))}` : part))
    .join(" ");
}


function createServiceClient() {
  const url = process.env['SUPABASE_URL']!;
  const key = process.env['SUPABASE_SERVICE_ROLE_KEY']!;
  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      storage: undefined,
    },
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

export interface OrderItem {
  id: string;
  title: string;
  variant_title: string | null;
  quantity: number;
  price: number;
  lens_type: string | null;
  prescription: {
    product_type: string | null;
    right_sph: number | null;
    right_cyl: number | null;
    right_axis: number | null;
    right_add: number | null;
    left_sph: number | null;
    left_cyl: number | null;
    left_axis: number | null;
    left_add: number | null;
    pd: number | null;
    notes: string | null;
    photo_url: string | null;
  } | null;
}

export interface OrderDetails {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total: number;
  subtotal: number;
  delivery_fee: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  pincode: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  created_at: string;
  items: OrderItem[];
  /** True when the caller did not prove ownership — PII and Rx are withheld. */
  redacted: boolean;
}

export const getOrderByNumber = createServerFn({ method: "POST" })
  .inputValidator((input: { orderNumber: string; phone?: string }) => {
    const orderNumber = String(input?.orderNumber ?? "").trim();
    if (!ORDER_NUMBER_RE.test(orderNumber)) {
      throw new Error("INVALID_ORDER_NUMBER");
    }
    const rawPhone = String(input?.phone ?? "").replace(/\D/g, "").slice(-10);
    const phone = PHONE_RE.test(rawPhone) ? rawPhone : null;
    return { orderNumber, phone };
  })
  .handler(async ({ data }) => {
    // Enumeration guard: order references are short, so cap lookups per IP.
    enforceRateLimit("order:lookup", 20, 60_000);

    const supabase = createServiceClient();
    const { data: rows, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("order_number", data.orderNumber)
      .limit(1);

    if (error) {
      console.error("[orders] getOrderByNumber failed", error);
      throw new Error("ORDER_LOOKUP_FAILED");
    }

    const row = rows?.[0];
    if (!row) return null;

    // Ownership is proven only by supplying the mobile number on the order.
    const storedPhone = String(row.customer_phone ?? "").replace(/\D/g, "").slice(-10);
    const owner = Boolean(data.phone) && data.phone === storedPhone;
    const redacted = !owner;

    const rawItems = (row.order_items ?? []) as OrderItemRow[];

    let rxMap = new Map<string, PrescriptionRow>();
    if (owner) {
      const prescriptionIds = rawItems
        .map((i) => i.prescription_id)
        .filter((id): id is string => Boolean(id));

      if (prescriptionIds.length > 0) {
        const { data: rxRows, error: rxError } = await supabase
          .from("prescriptions")
          .select("*")
          .in("id", prescriptionIds);
        if (rxError) console.error("[orders] prescription lookup failed", rxError);
        else rxMap = new Map((rxRows ?? []).map((rx) => [rx.id, rx]));
      }
    }

    return {
      id: row.id,
      order_number: row.order_number,
      status: row.status,
      payment_status: row.payment_status,
      total: row.total,
      subtotal: row.subtotal,
      delivery_fee: row.delivery_fee,
      customer_name: owner ? row.customer_name : maskName(row.customer_name),
      customer_phone: owner ? row.customer_phone : maskPhone(row.customer_phone),
      customer_email: owner ? row.customer_email : maskEmail(row.customer_email),
      address_line1: owner ? row.address_line1 : "",
      address_line2: owner ? row.address_line2 : null,
      city: owner ? row.city : "",
      state: owner ? row.state : "",
      pincode: owner ? row.pincode : "",
      razorpay_order_id: owner ? row.razorpay_order_id : null,
      razorpay_payment_id: owner ? row.razorpay_payment_id : null,
      created_at: row.created_at,
      redacted,
      items: rawItems.map((item) => {
        const rx = owner && item.prescription_id ? rxMap.get(item.prescription_id) : null;
        return {
          id: item.id,
          title: item.title,
          variant_title: item.variant_title,
          quantity: item.quantity,
          price: item.price,
          lens_type: item.lens_type,
          prescription: rx
            ? {
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
                notes: rx.notes,
                photo_url: rx.photo_url,
              }
            : null,
        };

      }),
    } as OrderDetails;
  });

// NOTE: a public "list orders by phone" endpoint was removed deliberately —
// it allowed anyone to enumerate customer PII by guessing mobile numbers.
// Order history must go through the authenticated admin panel or an
// ownership-proving lookup (order reference + mobile number) above.
