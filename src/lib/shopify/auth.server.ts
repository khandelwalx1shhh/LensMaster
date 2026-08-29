/**
 * Shopify Admin API authentication — server only.
 *
 * Supports both:
 * 1. Direct Admin API Access Token (shpat_... / Custom App) via LM_SHOPIFY_ACCESS_TOKEN
 * 2. Modern OAuth 2.0 client_credentials grant via LM_SHOPIFY_CLIENT_ID + LM_SHOPIFY_CLIENT_SECRET
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
  const config = getShopifyConfig();

  // If a direct Admin API access token (e.g. shpat_...) is provided, use it directly.
  if (config.accessToken) {
    return config.accessToken;
  }

  if (!config.clientId || !config.clientSecret) {
    throw new ShopifyAuthError("SHOPIFY_CREDENTIALS_MISSING");
  }

  const url = `https://${config.domain}/admin/oauth/access_token`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: config.clientId,
        client_secret: config.clientSecret,
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
  tokenCache.set(config.domain, { token: payload.access_token, expiresAt: Date.now() + ttlMs });
  console.info("[shopify-auth] Shopify authentication succeeded");
  return payload.access_token;
}

/** Returns a valid Admin API access token, refreshing it when needed. */
export async function getAdminAccessToken(forceRefresh = false): Promise<string> {
  const config = getShopifyConfig();

  // If a direct token is provided, return it immediately without caching
  if (config.accessToken) {
    return config.accessToken;
  }

  const { domain } = config;

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
