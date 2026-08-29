/** Safe Shopify connection health check — returns no credentials. */
import { getShopifyConfig, ShopifyConfigError } from "./config.server";
import { shopifyGraphQL, ShopifyApiError } from "./client.server";

export interface ShopifyHealth {
  connected: boolean;
  shop?: string;
  apiVersion?: string;
  error?: string;
}

export async function checkShopifyHealth(): Promise<ShopifyHealth> {
  let config: ReturnType<typeof getShopifyConfig>;
  try {
    config = getShopifyConfig();
  } catch (error) {
    if (error instanceof ShopifyConfigError) {
      return { connected: false, error: error.message };
    }
    return { connected: false, error: "NOT_CONFIGURED" };
  }

  try {
    await shopifyGraphQL<{ shop: { myshopifyDomain: string } }>(
      `query LmHealth { shop { myshopifyDomain } }`,
    );
    return { connected: true, shop: config.domain, apiVersion: config.apiVersion };
  } catch (error) {
    console.error("[shopify] health check failed", {
      code: (error as Error)?.message,
    });
    return {
      connected: false,
      shop: config.domain,
      apiVersion: config.apiVersion,
      error: error instanceof ShopifyApiError ? error.code : "UNAVAILABLE",
    };
  }
}
