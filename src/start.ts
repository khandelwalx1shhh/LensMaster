import { createStart, createMiddleware } from "@tanstack/react-start";
import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const SECURITY_HEADERS: Record<string, string> = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(self), microphone=(), geolocation=(self), payment=(self), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-site",
  "X-DNS-Prefetch-Control": "on",
  "Content-Security-Policy": [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self' https://*.myshopify.com https://shop.app https://api.razorpay.com https://*.razorpay.com https://securegw-stage.paytm.in https://securegw.paytm.in",
    "img-src 'self' data: blob: https://cdn.shopify.com https://img.logo.dev https://*.googleusercontent.com https://*.gstatic.com https://*.razorpay.com",
    "font-src 'self' data: https://fonts.gstatic.com https://*.razorpay.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.shopify.com https://checkout.razorpay.com https://*.razorpay.com",
    "connect-src 'self' https://*.supabase.co https://*.myshopify.com https://cdn.shopify.com https://img.logo.dev https://api.postalpincode.in https://*.razorpay.com https://lumberjack.razorpay.com https://*.lovable.dev https://*.lovable.app wss:",
    "frame-src 'self' https://www.google.com https://www.google.co.in https://maps.google.com https://api.razorpay.com https://*.razorpay.com",
    "media-src 'self' https://cdn.shopify.com",
    "worker-src 'self' blob:",
    "upgrade-insecure-requests",
  ].join("; "),
};

function withSecurityHeaders(response: Response): Response {
  // IMPORTANT: Do NOT re-wrap the response body via `new Response(response.body, ...)`.
  // TanStack Start SSR uses a ReadableStream body. Re-wrapping it transfers the
  // underlying byte stream to a new Response, which breaks streaming in Vercel's
  // serverless/edge runtime and results in a blank white page (200 with empty body).
  //
  // Instead, append headers directly onto the existing Response object's headers.
  // Response.headers is mutable via .set() and .append() even after construction.
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    if (!response.headers.has(key)) {
      try {
        response.headers.set(key, value);
      } catch {
        // In some runtimes Response.headers may be read-only; skip gracefully.
      }
    }
  }
  return response;
}

const requestMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    const res = await next();
    return withSecurityHeaders(res);
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return withSecurityHeaders(
      new Response(renderErrorPage(error), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      }),
    );
  }
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [requestMiddleware],
}));
