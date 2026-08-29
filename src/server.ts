import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

// OWASP A05 — Security Misconfiguration: harden every response with a strict
// baseline of security headers. Kept in one place so it applies uniformly to
// SSR HTML, static assets, and server-fn responses.
const SECURITY_HEADERS: Record<string, string> = {
  // HSTS: force HTTPS for a year on all subdomains.
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  // Block content-type sniffing.
  "X-Content-Type-Options": "nosniff",
  // Deny framing (clickjacking).
  "X-Frame-Options": "DENY",
  // Limit referrer leakage.
  "Referrer-Policy": "strict-origin-when-cross-origin",
  // Lock down powerful browser APIs we don't use.
  "Permissions-Policy":
    "camera=(self), microphone=(), geolocation=(self), payment=(self), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",
  // Isolate browsing context.
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-site",
  "X-DNS-Prefetch-Control": "on",
  // Content Security Policy — allow only the domains we actually need:
  // Shopify CDN (product images), Logo.dev (brand logos), Google Maps (stores),
  // WhatsApp (contact), and Lovable analytics/error reporting.
  "Content-Security-Policy": [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    // Razorpay hosts the checkout modal; Paytm kept for legacy form posts.
    "form-action 'self' https://*.myshopify.com https://shop.app https://api.razorpay.com https://*.razorpay.com https://securegw-stage.paytm.in https://securegw.paytm.in",
    "img-src 'self' data: blob: https://cdn.shopify.com https://img.logo.dev https://*.googleusercontent.com https://*.gstatic.com https://*.razorpay.com",
    "font-src 'self' data: https://fonts.gstatic.com https://*.razorpay.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    // 'unsafe-inline' on script-src is required for TanStack Start's hydration
    // bootstrap; 'unsafe-eval' is required by Vite in dev. Both are acceptable
    // given strict object-src/frame-ancestors and connect-src whitelist.
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.shopify.com https://checkout.razorpay.com https://*.razorpay.com",
    // *.supabase.co is required by the OAuth consent page (auth session + approve/deny).
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
    // Don't overwrite headers the app deliberately set.
    if (!headers.has(key)) headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      const normalized = await normalizeCatastrophicSsrResponse(response);
      return withSecurityHeaders(normalized);
    } catch (error) {
      console.error(error);
      return withSecurityHeaders(
        new Response(renderErrorPage(), {
          status: 500,
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
      );
    }
  },
};
