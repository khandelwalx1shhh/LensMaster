/**
 * Centralised, server-only Shopify configuration.
 *
 * Reads env at call time (Workers inject env per-request). Values are never
 * returned to the client and never logged.
 */

export interface ShopifyConfig {
  domain: string;
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  apiVersion: string;
}

export const DEFAULT_SHOPIFY_API_VERSION = "2025-01";

export class ShopifyConfigError extends Error {
  constructor(message = "SHOPIFY_NOT_CONFIGURED") {
    super(message);
    this.name = "ShopifyConfigError";
  }
}

/** Returns config or throws ShopifyConfigError. Never includes secret values in the message. */
export function getShopifyConfig(): ShopifyConfig {
  const rawDomain =
    process.env["LM_SHOPIFY_DOMAIN"] ||
    process.env["SHOPIFY_DOMAIN"] ||
    process.env["SHOPIFY_STORE_DOMAIN"] ||
    process.env["VITE_SHOPIFY_DOMAIN"];

  const accessToken = (
    process.env["LM_SHOPIFY_ACCESS_TOKEN"] ||
    process.env["SHOPIFY_ADMIN_ACCESS_TOKEN"] ||
    process.env["SHOPIFY_ACCESS_TOKEN"] ||
    process.env["LM_SHOPIFY_ADMIN_TOKEN"]
  )?.trim();

  const clientId = (
    process.env["LM_SHOPIFY_CLIENT_ID"] ||
    process.env["SHOPIFY_CLIENT_ID"] ||
    process.env["SHOPIFY_API_KEY"]
  )?.trim();

  const clientSecret = (
    process.env["LM_SHOPIFY_CLIENT_SECRET"] ||
    process.env["SHOPIFY_CLIENT_SECRET"] ||
    process.env["SHOPIFY_API_SECRET"]
  )?.trim();

  const apiVersion = (
    process.env["LM_SHOPIFY_API_VERSION"] ||
    process.env["SHOPIFY_API_VERSION"] ||
    DEFAULT_SHOPIFY_API_VERSION
  ).trim();

  if (!rawDomain) {
    console.error("[shopify] missing configuration: LM_SHOPIFY_DOMAIN is not set in .env");
    throw new ShopifyConfigError("SHOPIFY_DOMAIN_MISSING");
  }

  // Normalize domain (accept "my-store", "my-store.myshopify.com", "https://my-store.myshopify.com")
  let normalized = rawDomain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");

  if (!normalized.includes(".")) {
    normalized = `${normalized}.myshopify.com`;
  }

  if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(normalized)) {
    console.error(`[shopify] "${rawDomain}" is not a valid myshopify.com domain`);
    throw new ShopifyConfigError("SHOPIFY_INVALID_DOMAIN");
  }

  const hasDirectToken = Boolean(accessToken);
  const hasClientCredentials = Boolean(clientId && clientSecret);

  if (!hasDirectToken && !hasClientCredentials) {
    console.error(
      "[shopify] missing credentials: set either LM_SHOPIFY_ACCESS_TOKEN (recommended for custom apps) OR LM_SHOPIFY_CLIENT_ID & LM_SHOPIFY_CLIENT_SECRET in .env",
    );
    throw new ShopifyConfigError("SHOPIFY_CREDENTIALS_MISSING");
  }

  return {
    domain: normalized,
    clientId,
    clientSecret,
    accessToken,
    apiVersion,
  };
}

export function isShopifyConfigured(): boolean {
  try {
    getShopifyConfig();
    return true;
  } catch {
    return false;
  }
}
