import { createFileRoute } from "@tanstack/react-router";
import { listProducts, searchProducts, listCollections } from "@/lib/shopify/products.server";

/**
 * Public catalogue reads proxied through our backend so Shopify credentials
 * never reach the browser. Only safe, published product data is returned.
 */
export const Route = createFileRoute("/api/shopify/products")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get("q");
        const collections = url.searchParams.get("collections");
        const first = Number(url.searchParams.get("first") ?? 24);
        const after = url.searchParams.get("after");
        const id = url.searchParams.get("id");
        const handle = url.searchParams.get("handle");

        try {
          if (collections === "1") {
            return Response.json({ collections: await listCollections() });
          }
          if (q) {
            return Response.json({ products: await searchProducts(q, Number.isFinite(first) ? first : 20) });
          }
          if (id || handle) {
            const { getProductById, getProductByHandle } = await import("@/lib/shopify/products.server");
            const product = id ? await getProductById(id) : await getProductByHandle(handle!);
            if (!product) return new Response("Not found", { status: 404 });
            return Response.json({ product });
          }
          const page = await listProducts({ first: Number.isFinite(first) ? first : 24, after });
          return Response.json(page);
        } catch (error) {
          console.error("[api/shopify/products] request failed", { code: (error as Error)?.message });
          return Response.json({ error: "CATALOGUE_UNAVAILABLE" }, { status: 503 });
        }
      },
    },
  },
});
