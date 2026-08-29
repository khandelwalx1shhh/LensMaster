import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "list_collections",
  title: "List collections",
  description: "List Lens Master Shopify collections (e.g. Blue Cut, Sunglasses) with handles and product counts.",
  inputSchema: {
    limit: z.number().int().min(1).max(100).optional().describe("How many collections to return (default 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }) => {
    const { listCollections } = await import("@/lib/shopify/products.server");
    const collections = await listCollections(limit ?? 50);
    return {
      content: [{ type: "text", text: JSON.stringify(collections, null, 2) }],
      structuredContent: { collections },
    };
  },
});
