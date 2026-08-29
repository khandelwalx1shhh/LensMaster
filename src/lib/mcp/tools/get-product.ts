import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { toDetail } from "../format";

export default defineTool({
  name: "get_product",
  title: "Get product details",
  description:
    "Fetch one Lens Master product by handle or Shopify product ID, including description, images, lens/frame metafields, variants, SKUs, prices and live stock.",
  inputSchema: {
    handle: z.string().trim().min(1).max(120).optional().describe("Product handle, e.g. skyline-aviator."),
    productId: z.string().trim().min(1).max(120).optional().describe("Shopify product ID or GID."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ handle, productId }) => {
    if (!handle && !productId) {
      return { content: [{ type: "text", text: "Provide either handle or productId." }], isError: true };
    }
    const { getProductByHandle, getProductById } = await import("@/lib/shopify/products.server");
    const product = handle ? await getProductByHandle(handle) : await getProductById(productId!);
    if (!product) {
      return { content: [{ type: "text", text: "Product not found." }], isError: true };
    }
    const detail = toDetail(product);
    return {
      content: [{ type: "text", text: JSON.stringify(detail, null, 2) }],
      structuredContent: { product: detail },
    };
  },
});
