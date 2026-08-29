/** Safe Shopify connection health check — returns no credentials. */
import { getShopifyConfig } from "./config.server";
import { shopifyGraphQL } from "./client.server";

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
  } catch {
    return { connected: false, error: "NOT_CONFIGURED" };
  }

  try {
    await shopifyGraphQL<{ shop: { myshopifyDomain: string } }>(`query LmHealth { shop { myshopifyDomain } }`);
    return { connected: true, shop: config.domain, apiVersion: config.apiVersion };
  } catch (error) {
    console.error("[shopify] health check failed", { code: (error as Error)?.message });
    return { connected: false, shop: config.domain, apiVersion: config.apiVersion, error: "UNAVAILABLE" };
  }
}
