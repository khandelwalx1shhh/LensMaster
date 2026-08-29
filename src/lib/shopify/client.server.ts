/**
 * The single Shopify Admin API client for the whole app — server only.
 * Handles auth injection, retries on 401/429, timeouts and safe logging.
 */
import { getShopifyConfig } from "./config.server";
import { getAdminAccessToken, ShopifyAuthError } from "./auth.server";

const REQUEST_TIMEOUT_MS = 15_000;
const MAX_ATTEMPTS = 3;

export class ShopifyApiError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "ShopifyApiError";
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function adminFetch(
  path: string,
  init: { method: string; body?: string },
  attempt = 1,
  forceRefreshToken = false,
): Promise<Response> {
  const { domain, apiVersion } = getShopifyConfig();
  const token = await getAdminAccessToken(forceRefreshToken);
  const url = `https://${domain}/admin/api/${apiVersion}${path}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(url, {
      method: init.method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: init.body,
      signal: controller.signal,
    });
  } catch (networkError) {
    console.error("[shopify] request failed (network)", { path, attempt });
    if (attempt < MAX_ATTEMPTS) {
      await sleep(2 ** attempt * 250);
      return adminFetch(path, init, attempt + 1, forceRefreshToken);
    }
    throw new ShopifyApiError("SHOPIFY_UNAVAILABLE");
  } finally {
    clearTimeout(timer);
  }

  // Expired / revoked token → refresh once.
  if ((response.status === 401 || response.status === 403) && attempt < MAX_ATTEMPTS && !forceRefreshToken) {
    console.warn("[shopify] access token rejected, re-authenticating");
    return adminFetch(path, init, attempt + 1, true);
  }

  if (response.status === 429 && attempt < MAX_ATTEMPTS) {
    const retryAfter = Number(response.headers.get("Retry-After") ?? 1);
    console.warn("[shopify] rate limit encountered", { path, attempt });
    await sleep(Math.min(retryAfter * 1000 || 1000, 5000));
    return adminFetch(path, init, attempt + 1, forceRefreshToken);
  }

  return response;
}

/** Execute a GraphQL Admin API operation. */
export async function shopifyGraphQL<T = unknown>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  let response: Response;
  try {
    response = await adminFetch("/graphql.json", {
      method: "POST",
      body: JSON.stringify({ query, variables }),
    });
  } catch (error) {
    if (error instanceof ShopifyAuthError) throw new ShopifyApiError(error.code);
    throw error;
  }

  if (!response.ok) {
    console.error(`[shopify] GraphQL request failed with HTTP ${response.status}`);
    throw new ShopifyApiError("SHOPIFY_UNAVAILABLE");
  }

  const json = (await response.json().catch(() => null)) as
    | { data?: T; errors?: Array<{ message: string }> }
    | null;

  if (!json) throw new ShopifyApiError("SHOPIFY_UNAVAILABLE");
  if (json.errors?.length) {
    console.error("[shopify] GraphQL errors", json.errors.map((e) => e.message));
    throw new ShopifyApiError("SHOPIFY_REQUEST_FAILED");
  }
  console.info("[shopify] GraphQL request completed");
  return json.data as T;
}

/** Execute a REST Admin API call (used only where GraphQL has no equivalent). */
export async function shopifyREST<T = unknown>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const response = await adminFetch(path, {
    method,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    console.error(`[shopify] REST ${method} request failed with HTTP ${response.status}`, { path });
    throw new ShopifyApiError("SHOPIFY_UNAVAILABLE");
  }
  return (await response.json()) as T;
}
