import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getRazorpayConfig, verifyPaymentSignature } from "@/lib/razorpay.server";
import { markOrderPaid } from "@/lib/supabase-service.server";

const VerifySchema = z.object({
  razorpay_order_id: z.string().min(1, "razorpay_order_id is required"),
  razorpay_payment_id: z.string().min(1, "razorpay_payment_id is required"),
  razorpay_signature: z.string().min(1, "razorpay_signature is required"),
});

export const Route = createFileRoute("/api/verify-payment")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let rawBody: unknown;
        try {
          rawBody = await request.json();
        } catch {
          return Response.json(
            { success: false, error: "Invalid JSON body" },
            { status: 400 },
          );
        }

        const parseResult = VerifySchema.safeParse(rawBody);
        if (!parseResult.success) {
          return Response.json(
            {
              success: false,
              error: "MISSING_REQUIRED_FIELDS",
              issues: parseResult.error.issues,
            },
            { status: 400 },
          );
        }

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
          parseResult.data;

        let keySecret: string;
        try {
          keySecret = getRazorpayConfig().keySecret;
        } catch (error) {
          console.error("[verify-payment] Razorpay config missing:", error);
          return Response.json(
            { success: false, error: "Razorpay credentials not configured" },
            { status: 503 },
          );
        }

        // Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
        const isSignatureValid = verifyPaymentSignature(
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          keySecret,
        );

        if (!isSignatureValid) {
          console.error("[verify-payment] Signature mismatch:", {
            razorpay_order_id,
            razorpay_payment_id,
          });
          return Response.json(
            {
              success: false,
              verified: false,
              error: "SIGNATURE_VERIFICATION_FAILED",
            },
            { status: 400 },
          );
        }

        // Optionally persist paid state in database if order exists
        let persisted = false;
        try {
          persisted = await markOrderPaid({
            razorpayOrderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            signature: razorpay_signature,
          });
        } catch (dbErr) {
          console.warn("[verify-payment] Database update skipped or failed:", dbErr);
        }

        return Response.json({
          success: true,
          verified: true,
          message: "Payment verified successfully",
          order_id: razorpay_order_id,
          payment_id: razorpay_payment_id,
          persisted,
        });
      },
    },
  },
});
