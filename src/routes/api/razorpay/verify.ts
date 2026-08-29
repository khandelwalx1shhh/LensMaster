import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getRazorpayConfig, verifyPaymentSignature } from "@/lib/razorpay.server";
import { markOrderPaid } from "@/lib/supabase-service.server";

const BodySchema = z.object({
  razorpay_order_id: z.string().min(4).max(120),
  razorpay_payment_id: z.string().min(4).max(120),
  razorpay_signature: z.string().min(16).max(256),
});


export const Route = createFileRoute("/api/razorpay/verify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let parsed: z.infer<typeof BodySchema>;
        try {
          parsed = BodySchema.parse(await request.json());
        } catch {
          return Response.json({ verified: false }, { status: 400 });
        }

        let keySecret: string;
        try {
          keySecret = getRazorpayConfig().keySecret;
        } catch (error) {
          console.error("[razorpay] missing configuration on verify", error);
          return Response.json({ verified: false }, { status: 503 });
        }

        const verified = verifyPaymentSignature(
          parsed.razorpay_order_id,
          parsed.razorpay_payment_id,
          parsed.razorpay_signature,
          keySecret,
        );
        if (!verified) {
          console.error("[razorpay] signature verification failed", {
            orderId: parsed.razorpay_order_id,
          });
          return Response.json({ verified: false }, { status: 400 });
        }

        // Persist paid state (retries in case the order insert is still settling).
        const persisted = await markOrderPaid({
          razorpayOrderId: parsed.razorpay_order_id,
          paymentId: parsed.razorpay_payment_id,
          signature: parsed.razorpay_signature,
        });

        console.log("[razorpay] verified payment", {
          orderId: parsed.razorpay_order_id,
          paymentId: parsed.razorpay_payment_id,
          persisted,
        });
        return Response.json({ success: true, verified: true, persisted });

      },
    },
  },
});
