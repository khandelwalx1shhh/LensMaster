import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { toSummary } from "../format";

export default defineTool({
  name: "search_products",
  title: "Search eyewear products",
  description:
    "Search the Lens Master catalogue (frames, sunglasses, blue-cut and contact lenses) by keyword, brand, tag or product type. Returns titles, handles, prices and stock state.",
  inputSchema: {
    query: z.string().trim().min(1).max(80).describe("Keyword, brand or product type to search for."),
    limit: z.number().int().min(1).max(25).optional().describe("Maximum products to return (default 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }) => {
    const { searchProducts } = await import("@/lib/shopify/products.server");
    const products = await searchProducts(query, limit ?? 10);
    const items = products.map(toSummary);
    return {
      content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
      structuredContent: { products: items },
    };
  },
});
