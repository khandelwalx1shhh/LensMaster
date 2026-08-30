import { createFileRoute } from "@tanstack/react-router";
import { fetchProducts } from "@/lib/shopify";
import { SITE_URL, absoluteUrl } from "@/lib/seo";

function escapeXml(unsafe: string): string {
  return (unsafe || "")
    .replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case "<":
          return "&lt;";
        case ">":
          return "&gt;";
        case "&":
          return "&amp;";
        case "'":
          return "&apos;";
        case '"':
          return "&quot;";
        default:
          return c;
      }
    });
}

export const Route = createFileRoute("/feed.google-merchant.xml")({
  server: {
    handlers: {
      GET: async () => {
        let products: any[] = [];
        try {
          products = await fetchProducts(250);
        } catch (e) {
          console.error("Failed to fetch products for Google Merchant feed:", e);
        }

        const items = products
          .map((p) => {
            const node = p.node;
            if (!node || !node.title) return "";

            const handle = node.handle;
            const link = absoluteUrl(`/product/${handle}`);
            const image = node.images?.edges?.[0]?.node?.url || `${SITE_URL}/og-image.jpg`;
            const firstVariant = node.variants?.edges?.[0]?.node;
            const priceAmount = parseFloat(
              firstVariant?.price?.amount || node.priceRange?.minVariantPrice?.amount || "0",
            ).toFixed(2);
            const currency = firstVariant?.price?.currencyCode || "INR";
            const inStock = node.variants?.edges?.some((v: any) => v.node.availableForSale) ?? true;
            const vendor = node.vendor || "Lens Master";
            const id = firstVariant?.id || node.id || handle;
            const description = node.description
              ? escapeXml(node.description.slice(0, 5000))
              : `Buy authentic ${escapeXml(node.title)} by ${escapeXml(vendor)} at Lens Master Jaipur. Precision optical lenses fitted with computerized eye testing in Lalkothi, Jaipur.`;

            return `    <item>
      <g:id>${escapeXml(id)}</g:id>
      <g:title>${escapeXml(node.title)}</g:title>
      <g:description>${description}</g:description>
      <g:link>${escapeXml(link)}</g:link>
      <g:image_link>${escapeXml(image)}</g:image_link>
      <g:availability>${inStock ? "in_stock" : "out_of_stock"}</g:availability>
      <g:price>${priceAmount} ${currency}</g:price>
      <g:brand>${escapeXml(vendor)}</g:brand>
      <g:condition>new</g:condition>
      <g:google_product_category>549</g:google_product_category>
      <g:product_type>${escapeXml(node.productType || "Eyewear")}</g:product_type>
      <g:identifier_exists>no</g:identifier_exists>
      <g:shipping>
        <g:country>IN</g:country>
        <g:service>Standard Shipping</g:service>
        <g:price>0.00 INR</g:price>
      </g:shipping>
    </item>`;
          })
          .filter(Boolean)
          .join("\n");

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Lens Master — Google Merchant Center Product Feed</title>
    <link>${SITE_URL}</link>
    <description>Luxury Eyewear, Sunglasses and Precision Optical Frames Catalog from Lens Master Jaipur</description>
${items}
  </channel>
</rss>`;

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=86400",
          },
        });
      },
    },
  },
});
