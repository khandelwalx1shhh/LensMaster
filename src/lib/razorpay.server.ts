/**
 * Razorpay server-only helpers. Never import from client code — it reads the
 * merchant secret.
 */
import crypto from "node:crypto";

export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
  /** true when using rzp_test_ credentials */
  isTest: boolean;
}

/** MUST be called inside a request handler (env is injected per request). */
export function getRazorpayConfig(): RazorpayConfig {
  const keyId = process.env["RAZORPAY_KEY_ID"];
  const keySecret = process.env["RAZORPAY_KEY_SECRET"];
  if (!keyId || !keySecret) throw new Error("RAZORPAY_NOT_CONFIGURED");
  return { keyId, keySecret, isTest: keyId.startsWith("rzp_test_") };
}

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/** Verifies the checkout handler signature: HMAC_SHA256(order_id|payment_id). */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
  keySecret: string,
): boolean {
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return timingSafeEqual(expected, signature);
}

/** Verifies a Razorpay webhook body signature. */
export function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return timingSafeEqual(expected, signature);
}

export function razorpayAuthHeader(config: RazorpayConfig): string {
  return `Basic ${Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64")}`;
}
