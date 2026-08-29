import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getRazorpayConfig, getRazorpayClient } from "@/lib/razorpay.server";
import { priceOrder, priceOrderFromClient } from "@/lib/pricing.server";
import { createServiceClient, asUuid } from "@/lib/supabase-service.server";

const LineSchema = z.object({
  variantId: z.string().min(1).max(200),
  quantity: z.number().int().min(1).max(20),
  unitPrice: z.number().min(0).max(1_000_000).optional(),
  title: z.string().trim().max(200).optional(),
  variantTitle: z.string().trim().max(200).optional(),
  blueCutOffer: z.boolean().optional(),
  attributes: z.array(z.object({ key: z.string(), value: z.string() })).optional(),
});

const BodySchema = z.object({
  lines: z.array(LineSchema).min(1).max(30),
  customer: z.object({
    name: z.string().trim().min(2).max(80),
    phone: z.string().trim().regex(/^[6-9]\d{9}$/),
    email: z.string().trim().email().max(120).optional().or(z.literal("")),
  }),
  address: z.object({
    line1: z.string().trim().min(5).max(180),
    line2: z.string().trim().max(180).optional().or(z.literal("")),
    city: z.string().trim().min(2).max(60),
    state: z.string().trim().min(2).max(60),
    pincode: z.string().trim().regex(/^\d{6}$/),
  }),
});

function fail(status: number, code: string, message?: string) {
  return Response.json({ error: code, message }, { status });
}

function orderNumber(): string {
  return `LM${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function parseAttr(attrs: Array<{ key: string; value: string }> | undefined, key: string): string | undefined {
  return attrs?.find((a) => a.key === key)?.value;
}

function parseRxEye(value: string | undefined): {
  sph: number | null;
  cyl: number | null;
  axis: number | null;
  add: number | null;
} {
  const out = { sph: null as number | null, cyl: null as number | null, axis: null as number | null, add: null as number | null };
  if (!value) return out;
  for (const part of value.split("·")) {
    const m = part.trim().match(/^(SPH|CYL|AXIS|ADD)\s+(.+)$/i);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const num = parseFloat(m[2].replace(/[^0-9.\-+]/g, ""));
    if (isNaN(num)) continue;
    if (key === "sph") out.sph = num;
    if (key === "cyl") out.cyl = num;
    if (key === "axis") out.axis = num;
    if (key === "add") out.add = num;
  }
  return out;
}

export const Route = createFileRoute("/api/razorpay/order")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let parsed: z.infer<typeof BodySchema>;
        try {
          parsed = BodySchema.parse(await request.json());
        } catch (error) {
          console.error("[razorpay] invalid order payload", error);
          return fail(400, "INVALID_REQUEST", "Please check your delivery and contact details.");
        }

        let config: ReturnType<typeof getRazorpayConfig>;
        try {
          config = getRazorpayConfig();
        } catch (error) {
          console.error("[razorpay] missing configuration", error);
          return fail(503, "PAYMENTS_UNAVAILABLE", "Payment gateway is not configured.");
        }

        let priced: Awaited<ReturnType<typeof priceOrder>>;
        try {
          priced = await priceOrder(parsed.lines);
        } catch (error) {
          console.warn("[razorpay] pricing fallback to client lines", error);
          priced = priceOrderFromClient(parsed.lines);
        }

        const receipt = orderNumber();
        const amountInPaise = Math.max(100, Math.round(priced.total * 100));

        // Create Razorpay order first via SDK
        let razorpayOrderId: string;
        try {
          const razorpay = getRazorpayClient();
          const rzpOrder = await razorpay.orders.create({
            amount: amountInPaise,
            currency: "INR",
            receipt,
            notes: {
              name: parsed.customer.name,
              phone: parsed.customer.phone,
              city: parsed.address.city,
              pincode: parsed.address.pincode,
            },
          });
          razorpayOrderId = rzpOrder.id;
        } catch (error: any) {
          console.error("[razorpay] order request failed", error);
          return fail(502, "PAYMENTS_UNAVAILABLE", error?.message || "Failed to start Razorpay payment.");
        }

        // Attempt Supabase database persistence safely (non-blocking if database is unconfigured)
        try {
          const supabase = createServiceClient();
          if (supabase) {
            // Upsert customer by phone.
            const { data: existingCustomer } = await supabase
              .from("customers")
              .select("id")
              .eq("phone", parsed.customer.phone)
              .maybeSingle();

            let customerId = existingCustomer?.id;
            if (!customerId) {
              const { data: newCustomer } = await supabase
                .from("customers")
                .insert({
                  phone: parsed.customer.phone,
                  email: parsed.customer.email || null,
                  name: parsed.customer.name,
                  addresses: [
                    {
                      line1: parsed.address.line1,
                      line2: parsed.address.line2 || null,
                      city: parsed.address.city,
                      state: parsed.address.state,
                      pincode: parsed.address.pincode,
                    },
                  ],
                })
                .select("id")
                .single();
              if (newCustomer) customerId = newCustomer.id;
            }

            // Persist order.
            const { data: order } = await supabase
              .from("orders")
              .insert({
                order_number: receipt,
                customer_id: customerId || null,
                customer_name: parsed.customer.name,
                customer_phone: parsed.customer.phone,
                customer_email: parsed.customer.email || null,
                address_line1: parsed.address.line1,
                address_line2: parsed.address.line2 || null,
                city: parsed.address.city,
                state: parsed.address.state,
                pincode: parsed.address.pincode,
                subtotal: priced.subtotal,
                delivery_fee: priced.delivery,
                total: priced.total,
                razorpay_order_id: razorpayOrderId,
                status: "pending",
                payment_status: "pending",
              })
              .select("id")
              .single();

            if (order) {
              for (const line of parsed.lines) {
                const attrs = line.attributes ?? [];
                const productType = parseAttr(attrs, "Product Type") ?? "";
                const rxRight = parseRxEye(parseAttr(attrs, "Rx Right (OD)"));
                const rxLeft = parseRxEye(parseAttr(attrs, "Rx Left (OS)"));
                const pdRaw = parseAttr(attrs, "PD");
                const pd = pdRaw ? parseFloat(pdRaw.replace(/[^0-9.]/g, "")) : null;
                const notes = parseAttr(attrs, "Rx Notes") || null;
                const photoUrl = parseAttr(attrs, "Rx Photo") || null;

                let prescriptionId: string | null = null;
                if (customerId && (productType || rxRight.sph || rxLeft.sph || pd || notes || photoUrl)) {
                  const { data: rx } = await supabase
                    .from("prescriptions")
                    .insert({
                      customer_id: customerId,
                      product_type: productType || "powered",
                      right_sph: rxRight.sph,
                      right_cyl: rxRight.cyl,
                      right_axis: rxRight.axis,
                      right_add: rxRight.add,
                      left_sph: rxLeft.sph,
                      left_cyl: rxLeft.cyl,
                      left_axis: rxLeft.axis,
                      left_add: rxLeft.add,
                      pd,
                      notes,
                      photo_url: photoUrl,
                    })
                    .select("id")
                    .single();
                  if (rx) prescriptionId = rx.id;
                }

                await supabase.from("order_items").insert({
                  order_id: order.id,
                  product_id: null,
                  variant_id: asUuid(line.variantId),
                  variant_title: line.variantTitle || parseAttr(attrs, "Lens") || "Default",
                  title: line.title || parseAttr(attrs, "Contact Type") || "Eyewear",
                  quantity: line.quantity,
                  price: Math.max(line.unitPrice ?? 0, 0),
                  lens_type: parseAttr(attrs, "Lens"),
                  prescription_id: prescriptionId,
                });
              }
            }
          }
        } catch (dbErr) {
          console.warn("[razorpay] DB order recording skipped:", dbErr);
        }

        return Response.json({
          order_id: razorpayOrderId,
          orderId: razorpayOrderId,
          receipt,
          keyId: config.keyId,
          key_id: config.keyId,
          amount: priced.total,
          currency: "INR",
        });
      },
    },
  },
});
