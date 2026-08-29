import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { toSummary } from "../format";

export default defineTool({
  name: "list_products",
  title: "List catalogue products",
  description:
    "List Lens Master products from Shopify, most recently updated first. Use for browsing the catalogue when no search term is known.",
  inputSchema: {
    limit: z.number().int().min(1).max(50).optional().describe("How many products to return (default 20)."),
    cursor: z.string().trim().max(500).optional().describe("Pagination cursor returned by a previous call."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, cursor }) => {
    const { listProducts } = await import("@/lib/shopify/products.server");
    const page = await listProducts({ first: limit ?? 20, after: cursor ?? null });
    const items = page.products.map(toSummary);
    return {
      content: [
        { type: "text", text: JSON.stringify({ products: items, pageInfo: page.pageInfo }, null, 2) },
      ],
      structuredContent: { products: items, pageInfo: page.pageInfo },
    };
  },
});
