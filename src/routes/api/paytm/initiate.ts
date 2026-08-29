import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getPaytmConfig, generateSignature } from "@/lib/paytm.server";
import { priceOrder, priceOrderFromClient } from "@/lib/paytm-pricing.server";

const LineSchema = z.object({
  variantId: z.string().min(1).max(200).startsWith("gid://shopify/ProductVariant/"),
  quantity: z.number().int().min(1).max(20),
  unitPrice: z.number().min(0).max(1_000_000).optional(),
});

const BodySchema = z.object({
  lines: z.array(LineSchema).min(1).max(30),
  customer: z.object({
    name: z.string().trim().min(2).max(80),
    phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
    email: z.string().trim().email().max(120).optional().or(z.literal("")),
  }),
  address: z.object({
    line1: z.string().trim().min(5).max(180),
    line2: z.string().trim().max(180).optional().or(z.literal("")),
    city: z.string().trim().min(2).max(60),
    state: z.string().trim().min(2).max(60),
    pincode: z.string().trim().regex(/^\d{6}$/, "Enter a valid 6-digit PIN code"),
  }),
});

function fail(status: number, code: string) {
  return Response.json({ error: code }, { status });
}

export const Route = createFileRoute("/api/paytm/initiate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let parsed: z.infer<typeof BodySchema>;
        try {
          parsed = BodySchema.parse(await request.json());
        } catch (error) {
          console.error("[paytm] invalid initiate payload", error);
          return fail(400, "INVALID_REQUEST");
        }

        let config: ReturnType<typeof getPaytmConfig>;
        try {
          config = getPaytmConfig();
        } catch (error) {
          console.error("[paytm] missing configuration", error);
          return fail(503, "PAYMENTS_UNAVAILABLE");
        }

        let priced: Awaited<ReturnType<typeof priceOrder>>;
        try {
          priced = await priceOrder(parsed.lines);
        } catch (error) {
          console.error("[paytm] pricing failed", error);
          // In test mode we still let the payment through so the gateway can be
          // exercised while the catalogue is unavailable. Never in production.
          if (config.env !== "staging") return fail(502, "PAYMENTS_UNAVAILABLE");
          priced = priceOrderFromClient(parsed.lines);
        }

        const orderId = `LM${Date.now().toString(36).toUpperCase()}${Math.random()
          .toString(36)
          .slice(2, 7)
          .toUpperCase()}`;
        const origin = new URL(request.url).origin;

        const body = {
          requestType: "Payment",
          mid: config.mid,
          websiteName: config.website,
          orderId,
          callbackUrl: `${origin}/api/public/paytm/callback`,
          txnAmount: { value: priced.total.toFixed(2), currency: "INR" },
          userInfo: {
            custId: parsed.customer.phone,
            mobile: parsed.customer.phone,
            firstName: parsed.customer.name,
            ...(parsed.customer.email ? { email: parsed.customer.email } : {}),
          },
        };

        const payload = JSON.stringify(body);
        const head = { signature: generateSignature(payload, config.key) };

        let paytmJson: {
          body?: {
            txnToken?: string;
            resultInfo?: { resultStatus?: string; resultCode?: string; resultMsg?: string };
          };
        };
        try {
          const res = await fetch(
            `${config.host}/theia/api/v1/initiateTransaction?mid=${encodeURIComponent(
              config.mid,
            )}&orderId=${encodeURIComponent(orderId)}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ body, head }),
            },
          );
          paytmJson = await res.json();
        } catch (error) {
          console.error("[paytm] initiateTransaction request failed", error);
          return fail(502, "PAYMENTS_UNAVAILABLE");
        }

        const txnToken = paytmJson.body?.txnToken;
        if (!txnToken) {
          console.error("[paytm] initiateTransaction rejected", paytmJson.body?.resultInfo);
          return fail(502, "PAYMENTS_UNAVAILABLE");
        }

        // Address is echoed back to the client only for the confirmation screen;
        // nothing sensitive is persisted (no order database yet).
        return Response.json({
          orderId,
          txnToken,
          mid: config.mid,
          amount: priced.total,
          currency: priced.currency,
          paymentUrl: `${config.host}/theia/api/v1/showPaymentPage?mid=${encodeURIComponent(
            config.mid,
          )}&orderId=${encodeURIComponent(orderId)}`,
        });
      },
    },
  },
});
