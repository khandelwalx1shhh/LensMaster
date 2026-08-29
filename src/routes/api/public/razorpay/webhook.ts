import { createFileRoute } from "@tanstack/react-router";
import { getRazorpayConfig, verifyWebhookSignature } from "@/lib/razorpay.server";
import { markOrderPaid } from "@/lib/supabase-service.server";

/**
 * Razorpay webhook — the authoritative path for order persistence.
 * Fires even when the shopper closes the tab before the browser callback runs.
 * Configure it in the Razorpay dashboard for `payment.captured` / `order.paid`.
 */
export const Route = createFileRoute("/api/public/razorpay/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["RAZORPAY_WEBHOOK_SECRET"];
        if (!secret) {
          console.error("[razorpay] webhook secret not configured");
          return new Response("Not configured", { status: 503 });
        }

        const signature = request.headers.get("x-razorpay-signature") ?? "";
        const body = await request.text();
        if (!signature || !verifyWebhookSignature(body, signature, secret)) {
          console.error("[razorpay] webhook signature rejected");
          return new Response("Invalid signature", { status: 401 });
        }

        let payload: {
          event?: string;
          payload?: {
            payment?: { entity?: { id?: string; order_id?: string } };
            order?: { entity?: { id?: string } };
          };
        };
        try {
          payload = JSON.parse(body);
        } catch {
          return new Response("Invalid payload", { status: 400 });
        }

        const event = payload.event ?? "";
        if (event !== "payment.captured" && event !== "payment.authorized" && event !== "order.paid") {
          return new Response("ignored");
        }

        const payment = payload.payload?.payment?.entity;
        const razorpayOrderId = payment?.order_id ?? payload.payload?.order?.entity?.id;
        const paymentId = payment?.id;
        if (!razorpayOrderId || !paymentId) {
          console.error("[razorpay] webhook missing ids", { event });
          return new Response("Missing ids", { status: 400 });
        }

        // Ensure keys exist so we fail loudly if the environment is half-configured.
        try {
          getRazorpayConfig();
        } catch (error) {
          console.error("[razorpay] webhook received without gateway config", error);
        }

        const ok = await markOrderPaid({ razorpayOrderId, paymentId });
        // Always 200 on a verified webhook we understood; retries won't help a missing row.
        return Response.json({ received: true, updated: ok });
      },
    },
  },
});
