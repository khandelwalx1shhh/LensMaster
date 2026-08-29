# Security — OWASP Top 10 Mitigations

This app is a client-rendered TanStack Start storefront that talks to the
Shopify Storefront API. Below is how each of the OWASP Top 10 (2021) risks
is addressed in the current codebase.

| # | Risk | Mitigation |
|---|------|------------|
| A01 | Broken Access Control | No custom backend endpoints; all data comes from Shopify Storefront API (public read-only) and cart mutations require a Shopify cart id. Sensitive actions (checkout, add-to-cart, wishlist) are gated behind `requireAuth` in `src/stores/authStore.ts`. |
| A02 | Cryptographic Failures | HTTPS is enforced by Cloudflare + HSTS header set in `src/server.ts`. No secrets are shipped to the client — only the Shopify **public** Storefront token, which is scoped to unauthenticated read/cart access. |
| A03 | Injection / XSS | All third-party HTML (Shopify product descriptions, journal content) is sanitized through `src/lib/sanitize.ts` (DOMPurify). All user text input is validated with zod schemas in `src/lib/validation.ts` before use. CSP header in `src/server.ts` blocks inline script injection. |
| A04 | Insecure Design | Auth is OTP-gated with strict phone/OTP zod schemas. Cart line attributes are constrained to whitelisted keys. External links use `rel="noopener noreferrer"`. |
| A05 | Security Misconfiguration | Response security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, Cross-Origin-Opener-Policy) are added in `src/server.ts` for every response. |
| A06 | Vulnerable Components | `bun.lock` is a text lockfile scanned by Lovable's dependency scanner on every push. Run `bun outdated` periodically. |
| A07 | Identification & Authentication Failures | OTP flow enforces 6-digit codes and a validated Indian mobile format. Session lives in `localStorage` — never a long-lived server credential. Logout clears state. |
| A08 | Software & Data Integrity Failures | No dynamic `eval`, no runtime `import()` of untrusted URLs, no `<script>` injection. All npm deps are pinned via `bun.lock`. |
| A09 | Security Logging & Monitoring | Runtime errors are captured via `reportLovableError` → `window.__lovableEvents.captureException`. Server errors are logged in `src/server.ts` and `src/start.ts`. |
| A10 | Server-Side Request Forgery | The app makes no server-side requests to user-controlled URLs. The only outbound calls are to fixed Shopify endpoints. |

## Known limitations

- OTP flow is currently in **demo mode** (any 6-digit code works). Before
  production launch, wire `sendOtp` / `verifyOtp` in `src/stores/authStore.ts`
  to a real SMS provider (MSG91, Twilio, or Shopify Customer Accounts) and
  move verification server-side via a `createServerFn` handler.
- Auth session is stored in `localStorage`; not accessible cross-origin, but
  swap to httpOnly cookies once a real backend is in place.
