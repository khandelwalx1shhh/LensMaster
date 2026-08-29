import { createFileRoute } from "@tanstack/react-router";
import { checkShopifyHealth } from "@/lib/shopify/health.server";

export const Route = createFileRoute("/api/shopify/health")({
  server: {
    handlers: {
      GET: async () => {
        const health = await checkShopifyHealth();
        return Response.json(health, {
          status: health.connected ? 200 : 503,
          headers: { "cache-control": "no-store" },
        });
      },
    },
  },
});
