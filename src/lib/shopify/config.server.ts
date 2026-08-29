/**
 * Centralised, server-only Shopify configuration.
 *
 * Reads env at call time (Workers inject env per-request). Values are never
 * returned to the client and never logged.
 */

export interface ShopifyConfig {
  domain: string;
  clientId: string;
  clientSecret: string;
  apiVersion: string;
}

export const DEFAULT_SHOPIFY_API_VERSION = "2026-07";

export class ShopifyConfigError extends Error {
  constructor() {
    super("SHOPIFY_NOT_CONFIGURED");
    this.name = "ShopifyConfigError";
  }
}

/** Returns config or throws ShopifyConfigError. Never includes secret values in the message. */
export function getShopifyConfig(): ShopifyConfig {
  const domain = process.env["LM_SHOPIFY_DOMAIN"];
  const clientId = process.env["LM_SHOPIFY_CLIENT_ID"]?.trim();
  const clientSecret = process.env["LM_SHOPIFY_CLIENT_SECRET"]?.trim();
  const apiVersion = (process.env["LM_SHOPIFY_API_VERSION"] || DEFAULT_SHOPIFY_API_VERSION).trim();

  if (!domain || !clientId || !clientSecret) {
    const missing = [
      !domain && "LM_SHOPIFY_DOMAIN",
      !clientId && "LM_SHOPIFY_CLIENT_ID",
      !clientSecret && "LM_SHOPIFY_CLIENT_SECRET",
    ].filter(Boolean);
    console.error(`[shopify] missing configuration: ${missing.join(", ")}`);
    throw new ShopifyConfigError();
  }

  // Guard against SSRF / misconfiguration: only *.myshopify.com is accepted.
  const normalized = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(normalized)) {
    console.error("[shopify] LM_SHOPIFY_DOMAIN is not a valid myshopify.com domain");
    throw new ShopifyConfigError();
  }
  if (!/^\d{4}-\d{2}$/.test(apiVersion)) {
    console.error("[shopify] LM_SHOPIFY_API_VERSION is not a valid version string");
    throw new ShopifyConfigError();
  }

  return { domain: normalized, clientId, clientSecret, apiVersion };
}

export function isShopifyConfigured(): boolean {
  try {
    getShopifyConfig();
    return true;
  } catch {
    return false;
  }
}
