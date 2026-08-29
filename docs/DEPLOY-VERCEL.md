# Deploying Lens Master to Vercel

This app is a TanStack Start (Vite + Nitro) full-stack app. It builds to the
**Vercel Build Output API** (`.vercel/output`) via the `nitro: { preset: "vercel" }`
setting in `vite.config.ts`. No custom serverless functions or `outputDirectory`
are needed — Vercel reads `.vercel/output` automatically.

> The backend (Supabase database, auth, storage) stays on Lovable Cloud. Only the
> web app (frontend + SSR + server functions) moves to Vercel. No data migration.

---

## 0. Prerequisites

- A Vercel account (https://vercel.com) — free tier works for testing.
- The project pushed to a Git repo (GitHub / GitLab / Bitbucket). Vercel deploys
  from Git. If the project isn't in Git yet, push it to GitHub first.
- Bun installed locally is optional — Vercel uses its own build environment.

## 1. Push the project to Git

Vercel deploys from a connected Git repository. Make sure the latest code
(including `vercel.json` and the `nitro: { preset: "vercel" }` line in
`vite.config.ts`) is committed and pushed to your default branch (e.g. `main`).

## 2. Import the project on Vercel

1. Go to https://vercel.com/new.
2. Import your Git repository.
3. Vercel will auto-detect the framework. If it asks:
   - **Framework Preset**: `Other` (or leave blank) — the Nitro preset handles output.
   - **Build Command**: `bun run build` (already set in `vercel.json`).
   - **Install Command**: `bun install`.
   - **Output Directory**: leave it **empty / unset**. Nitro writes `.vercel/output`;
     do NOT point this at `dist` or `dist/client`.
4. Set the **Node.js Version** to `22.x` (Project Settings → General).
   Vercel matches the `nodejs22.x` runtime Nitro targets.

## 3. Add environment variables

This is the most important step. Add **every** variable below in
**Project Settings → Environment Variables** (Production + Preview + Development
scopes, unless noted).

### Client (public) — prefixed `VITE_`

These are safe to expose; they're the same values as in `.env`:

| Variable | Value | Scope |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://dxqtbwwkjjsdlpfnkiem.supabase.co` | All |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_dqHOJU2a-qfJNhslU2ocAA_uZr7O1b2` | All |
| `VITE_SUPABASE_PROJECT_ID` | `dxqtbwwkjjsdlpfnkiem` | All |
| `VITE_LOVABLE_CONNECTOR_LOGO_DEV_API_KEY` | `pk_OBL_Zh95TwizXFjE8hL3pA` | All |

### Server (secret) — NOT exposed to the browser

You must supply the **real secret values** yourself. Lovable stores these
encrypted and cannot export them as plaintext — retrieve each from its original
source (noted below) and paste the value into Vercel:

| Variable | Where to get the value | Scope |
|---|---|---|
| `SUPABASE_URL` | `https://dxqtbwwkjjsdlpfnkiem.supabase.co` (same as VITE_) | All |
| `SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_dqHOJU2a-qfJNhslU2ocAA_uZr7O1b2` (same as VITE_) | All |
| `SUPABASE_SERVICE_ROLE_KEY` | Lovable Cloud → Backend → Settings (service role key) | Production only |
| `SESSION_SECRET` | Generate a long random string (e.g. `openssl rand -hex 32`) | All |
| `LM_SHOPIFY_DOMAIN` | e.g. `r5rr2v-ty.myshopify.com` (your Shopify store domain) | All |
| `LM_SHOPIFY_CLIENT_ID` | Shopify Partners → your custom app → Client ID | All |
| `LM_SHOPIFY_CLIENT_SECRET` | Shopify Partners → your custom app → Client secret | Production only |
| `LM_SHOPIFY_API_VERSION` | `2026-07` | All |
| `RAZORPAY_KEY_ID` | Razorpay dashboard → API Keys → Key ID | All |
| `RAZORPAY_KEY_SECRET` | Razorpay dashboard → API Keys → Key Secret | Production only |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay dashboard → Webhooks → secret (see step 5) | Production only |
| `ADMIN_BOOTSTRAP_EMAIL` | e.g. `owner@lensmaster.in` | All |
| `ADMIN_PASSWORD` | Your admin password (or set via the bootstrap flow) | Production only |

> Tip: keep `SUPABASE_SERVICE_ROLE_KEY`, `LM_SHOPIFY_CLIENT_SECRET`,
> `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, and `ADMIN_PASSWORD` scoped to
> **Production** only so they don't leak into preview/PR environments.

## 4. Deploy

Click **Deploy**. The first build takes ~1–2 min. Watch the build logs:
you should see `[nitro:vercel] ℹ Using nodejs22.x runtime.` and a successful
`.vercel/output` generation.

Once live, Vercel gives you a `*.vercel.app` URL. Your routes work out of the box
(`/`, `/shop`, `/product/:handle`, `/checkout`, `/admin`, `/order-status`, etc.)
with no extra routing config.

## 5. Point external services at the Vercel URL

After deploy, update these callbacks to use your Vercel domain instead of the
Lovable preview domain:

- **Razorpay webhook**: set the webhook URL to
  `https://YOUR-VERCEL-DOMAIN.vercel.app/api/public/razorpay/webhook` and copy
  the webhook secret into `RAZORPAY_WEBHOOK_SECRET`.
- **Shopify app URLs**: in Shopify Partners, set the app's redirect/CLI URLs to
  your Vercel domain (for the OAuth client-credentials flow).
- **Supabase Auth redirects**: if you use the MCP OAuth consent flow, add the
  Vercel origin to the allowed redirect URLs in Supabase Auth settings.

## 6. Custom domain (optional)

In Vercel → Project → Settings → Domains, add your domain (e.g. `lensmaster.in`).
Update your DNS A/CNAME records as Vercel instructs. SSL is automatic.

## 7. Verify after deploy

- Visit `/` — homepage loads with live Shopify products.
- Visit `/shop` — products and search work.
- Run a guest checkout up to the Razorpay handoff.
- Visit `/admin/login` — admin login works.
- Visit `/api/shopify/health` — returns `{ status: "ok", shop: "..." }`.

## Notes & gotchas

- **Do not change `outputDirectory`** in Vercel settings. The Nitro Vercel preset
  emits `.vercel/output`; setting an output dir breaks the build.
- **Local Lovable preview is unaffected**. The `nitro: { preset: "vercel" }` line
  is only honored when building outside the Lovable sandbox; inside Lovable the
  build stays on Cloudflare, so your Lovable preview/publish keeps working.
- **The Lovable Publish button** still deploys to Lovable's own hosting
  (Cloudflare). If you want Vercel to be your only production host, simply don't
  use the Lovable Publish button — deploy via Vercel instead.
- **Cold starts**: serverless functions have a brief cold start. For a busy store,
  consider Vercel's Edge or Pro plan for more compute.
