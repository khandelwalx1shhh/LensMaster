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
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    if (!headers.has(key)) headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
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
