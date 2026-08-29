import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getRazorpayClient, getRazorpayConfig } from "@/lib/razorpay.server";

const CreateOrderSchema = z.object({
  amount: z.number().int().min(100, "Amount must be at least 100 paise (₹1)"),
  currency: z.string().trim().min(3).max(3).default("INR"),
  receipt: z.string().trim().max(40).optional(),
  notes: z.record(z.string()).optional(),
});

function fail(status: number, message: string, error?: unknown) {
  return Response.json(
    {
      error: message,
      details: error instanceof Error ? error.message : undefined,
    },
    { status },
  );
}

export const Route = createFileRoute("/api/create-order")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let rawBody: unknown;
        try {
          rawBody = await request.json();
        } catch {
          return fail(400, "Invalid JSON body");
        }

        const parseResult = CreateOrderSchema.safeParse(rawBody);
        if (!parseResult.success) {
          return Response.json(
            {
              error: "VALIDATION_FAILED",
              issues: parseResult.error.issues,
            },
            { status: 400 },
          );
        }

        const { amount, currency, receipt, notes } = parseResult.data;

        let config: ReturnType<typeof getRazorpayConfig>;
        try {
          config = getRazorpayConfig();
        } catch (error) {
          console.error("[create-order] Razorpay credentials not configured:", error);
          return fail(401, "Razorpay credentials not configured");
        }

        try {
          const razorpay = getRazorpayClient();
          const orderReceipt =
            receipt ||
            `rcpt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

          const order = await razorpay.orders.create({
            amount,
            currency: currency.toUpperCase(),
            receipt: orderReceipt,
            notes: notes || {},
          });

          return Response.json({
            order_id: order.id,
            id: order.id,
            amount: order.amount,
            currency: order.currency,
            receipt: order.receipt,
            key_id: config.keyId,
            keyId: config.keyId,
          });
        } catch (error: any) {
          console.error("[create-order] Razorpay API Error:", error);
          const statusCode = error?.statusCode || 500;
          return fail(
            statusCode === 401 ? 401 : 500,
            error?.error?.description || error?.message || "Failed to create Razorpay order",
            error,
          );
        }
      },
    },
  },
});
