import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchProductsTool from "./tools/search-products";
import listProductsTool from "./tools/list-products";
import getProductTool from "./tools/get-product";
import listCollectionsTool from "./tools/list-collections";
import checkAvailabilityTool from "./tools/check-availability";

// The OAuth issuer must be the direct Supabase host; the project ref is the only
// value that survives publish unchanged.
const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "lens-master-luxury",
  title: "Lens Master Luxury",
  version: "0.1.0",
  instructions:
    "Tools for the Lens Master optical store. Use `search_products` or `list_products` to browse the live catalogue, `get_product` for full specs, lens metafields and variants, `list_collections` for merchandising groups, and `check_availability` for live stock before recommending an item. All data comes from Shopify and is read-only.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    searchProductsTool,
    listProductsTool,
    getProductTool,
    listCollectionsTool,
    checkAvailabilityTool,
  ],
});
