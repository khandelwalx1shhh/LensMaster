/**
 * Storefront catalogue server functions.
 *
 * Thin wrappers only: every one of these runs on the Lens Master backend and
 * reads live data from the Shopify Admin GraphQL API. Shopify credentials never
 * cross the server boundary. There is no second product catalogue and no demo
 * fallback — if Shopify is unreachable the call fails and the UI shows an error
 * state.
 */
import { createServerFn } from "@tanstack/react-start";

export const getProducts = createServerFn({ method: "GET" })
  .inputValidator((input: { first?: number; query?: string | null } | undefined) => input ?? {})
  .handler(async ({ data }) => {
    const { listProducts } = await import("./shopify/products.server");
    const { toStorefrontProduct } = await import("./catalog/mapping");
    const { cached, CATALOG_TTL_MS } = await import("./catalog/cache.server");
    const first = data.first ?? 24;
    const query = data.query ?? null;
    return cached(`products:${first}:${query ?? ""}`, CATALOG_TTL_MS, async () => {
      const page = await listProducts({ first, query });
      return page.products.filter((p) => p.status === "ACTIVE").map(toStorefrontProduct);
    });
  });

export const getProductByHandle = createServerFn({ method: "GET" })
  .inputValidator((input: { handle: string }) => input)
  .handler(async ({ data }) => {
    const { getProductByHandle: byHandle } = await import("./shopify/products.server");
    const { toStorefrontProduct } = await import("./catalog/mapping");
    const { cached, CATALOG_TTL_MS } = await import("./catalog/cache.server");
    return cached(`product:${data.handle}`, CATALOG_TTL_MS, async () => {
      const product = await byHandle(data.handle);
      if (!product || product.status !== "ACTIVE") return null;
      return toStorefrontProduct(product);
    });
  });

export const getProductById = createServerFn({ method: "GET" })
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data }) => {
    const { getProductById: byId } = await import("./shopify/products.server");
    const { toStorefrontProduct } = await import("./catalog/mapping");
    const product = await byId(data.id);
    if (!product || product.status !== "ACTIVE") return null;
    return toStorefrontProduct(product);
  });

export const searchCatalogue = createServerFn({ method: "GET" })
  .inputValidator((input: { term: string; first?: number }) => input)
  .handler(async ({ data }) => {
    const { listProducts } = await import("./shopify/products.server");
    const { toStorefrontProduct } = await import("./catalog/mapping");
    const { cached, CATALOG_TTL_MS } = await import("./catalog/cache.server");
    const { searchProducts, relatedProducts } = await import("./search");

    // Search the whole live catalogue locally so every related product shows,
    // not just the ones Shopify's strict query syntax happens to match.
    const all = await cached("products:all:search", CATALOG_TTL_MS, async () => {
      const page = await listProducts({ first: 250, query: null });
      return page.products.filter((p) => p.status === "ACTIVE").map(toStorefrontProduct);
    });

    const limit = Math.min(data.first ?? 50, 250);
    const matches = searchProducts(all, data.term);
    if (matches.length) return matches.slice(0, limit);
    return relatedProducts(all, data.term, Math.min(limit, 8));
  });


export const getCollections = createServerFn({ method: "GET" }).handler(async () => {
  const { listCollections } = await import("./shopify/products.server");
  const { cached, CATALOG_TTL_MS } = await import("./catalog/cache.server");
  const collections = await cached("collections", CATALOG_TTL_MS, listCollections);
  return collections.map((c) => ({
    id: c.id,
    title: c.title,
    handle: c.handle,
    description: c.description ?? "",
    image: c.image ?? null,
    productsCount: c.productsCount?.count ?? 0,
  }));
});
