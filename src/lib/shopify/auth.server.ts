/**
 * Shopify Dev Dashboard app authentication — server only.
 *
 * Modern (non-legacy-install) apps authenticate to the Admin API with the
 * OAuth 2.0 *client credentials* grant:
 *
 *   POST https://{shop}/admin/oauth/access_token
 *   { client_id, client_secret, grant_type: "client_credentials" }
 *   -> { access_token, expires_in }
 *
 * The returned token is short-lived, kept in server memory only, refreshed
 * before expiry, and NEVER logged or sent to the browser.
 */
import { getShopifyConfig, ShopifyConfigError } from "./config.server";

interface CachedToken {
  token: string;
  expiresAt: number; // epoch ms
}

const TOKEN_TTL_FALLBACK_MS = 23 * 60 * 60 * 1000; // Shopify tokens last ~24h
const REFRESH_SKEW_MS = 60 * 1000;
const AUTH_TIMEOUT_MS = 10_000;

// Module-scope cache: one isolate = one cached token per shop.
const tokenCache = new Map<string, CachedToken>();
const inflight = new Map<string, Promise<string>>();

export class ShopifyAuthError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "ShopifyAuthError";
  }
}

async function requestToken(): Promise<string> {
  const { domain, clientId, clientSecret } = getShopifyConfig();
  const url = `https://${domain}/admin/oauth/access_token`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
      }),
      signal: controller.signal,
    });
  } catch (networkError) {
    console.error("[shopify-auth] network failure during authentication", {
      name: (networkError as Error)?.name,
    });
    throw new ShopifyAuthError("SHOPIFY_AUTH_UNAVAILABLE");
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    // Body may echo the request; never log it verbatim.
    console.error(`[shopify-auth] authentication rejected with HTTP ${response.status}`);
    throw new ShopifyAuthError(
      response.status === 401 || response.status === 400
        ? "SHOPIFY_AUTH_INVALID_CREDENTIALS"
        : "SHOPIFY_AUTH_UNAVAILABLE",
    );
  }

  const payload = (await response.json().catch(() => null)) as
    | { access_token?: string; expires_in?: number }
    | null;

  if (!payload?.access_token) {
    console.error("[shopify-auth] authentication response missing access token");
    throw new ShopifyAuthError("SHOPIFY_AUTH_UNAVAILABLE");
  }

  const ttlMs = payload.expires_in ? payload.expires_in * 1000 : TOKEN_TTL_FALLBACK_MS;
  tokenCache.set(domain, { token: payload.access_token, expiresAt: Date.now() + ttlMs });
  console.info("[shopify-auth] Shopify authentication succeeded");
  return payload.access_token;
}

/** Returns a valid Admin API access token, refreshing it when needed. */
export async function getAdminAccessToken(forceRefresh = false): Promise<string> {
  const { domain } = getShopifyConfig();

  if (!forceRefresh) {
    const cached = tokenCache.get(domain);
    if (cached && cached.expiresAt - REFRESH_SKEW_MS > Date.now()) return cached.token;
  } else {
    tokenCache.delete(domain);
  }

  const existing = inflight.get(domain);
  if (existing && !forceRefresh) return existing;

  const promise = requestToken().finally(() => inflight.delete(domain));
  inflight.set(domain, promise);
  return promise;
}

export function invalidateAdminAccessToken(): void {
  try {
    tokenCache.delete(getShopifyConfig().domain);
  } catch {
    /* not configured — nothing cached */
  }
}

export { ShopifyConfigError };
