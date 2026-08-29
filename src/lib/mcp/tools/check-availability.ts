import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "check_availability",
  title: "Check variant availability",
  description:
    "Check live Shopify stock and price for one or more product variants before recommending or ordering them.",
  inputSchema: {
    variantIds: z
      .array(z.string().trim().min(1).max(120))
      .min(1)
      .max(25)
      .describe("Shopify variant IDs or GIDs."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ variantIds }) => {
    const { getVariantAvailability } = await import("@/lib/shopify/inventory.server");
    const variants = await getVariantAvailability(variantIds);
    return {
      content: [{ type: "text", text: JSON.stringify(variants, null, 2) }],
      structuredContent: { variants },
    };
  },
});
