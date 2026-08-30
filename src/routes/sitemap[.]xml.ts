import { createFileRoute } from "@tanstack/react-router";
import { fetchProducts } from "@/lib/shopify";
import { SITE_URL, absoluteUrl } from "@/lib/seo";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
  lastmod?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const today = new Date().toISOString().split("T")[0];

        const staticEntries: SitemapEntry[] = [
          { path: "/", changefreq: "daily", priority: "1.0", lastmod: today },
          { path: "/shop", changefreq: "daily", priority: "0.9", lastmod: today },
          { path: "/lens-master-jaipur", changefreq: "daily", priority: "0.95", lastmod: today },
          { path: "/opticians-jaipur", changefreq: "weekly", priority: "0.9", lastmod: today },
          { path: "/stores", changefreq: "weekly", priority: "0.8", lastmod: today },
          { path: "/brands", changefreq: "weekly", priority: "0.8", lastmod: today },
          { path: "/about", changefreq: "monthly", priority: "0.6", lastmod: today },
          { path: "/shop?offer=blue-cut", changefreq: "daily", priority: "0.85", lastmod: today },
          { path: "/shop?category=prescription", changefreq: "weekly", priority: "0.8", lastmod: today },
          { path: "/shop?category=sunglasses", changefreq: "weekly", priority: "0.8", lastmod: today },
          { path: "/shop?category=blue-light", changefreq: "weekly", priority: "0.8", lastmod: today },
          { path: "/shop?category=contacts", changefreq: "weekly", priority: "0.8", lastmod: today },
          { path: "/shop?category=kids", changefreq: "weekly", priority: "0.7", lastmod: today },
          { path: "/shop?category=sports", changefreq: "weekly", priority: "0.7", lastmod: today },
          { path: "/shop?brand=Ray-Ban", changefreq: "weekly", priority: "0.75", lastmod: today },
          { path: "/shop?brand=Gucci", changefreq: "weekly", priority: "0.75", lastmod: today },
          { path: "/shop?brand=Oakley", changefreq: "weekly", priority: "0.75", lastmod: today },
          { path: "/shop?brand=Prada", changefreq: "weekly", priority: "0.75", lastmod: today },
          { path: "/privacy-policy", changefreq: "yearly", priority: "0.3", lastmod: today },
          { path: "/terms-and-conditions", changefreq: "yearly", priority: "0.3", lastmod: today },
        ];

        let productEntries: SitemapEntry[] = [];
        try {
          const products = await fetchProducts(250);
          productEntries = products.map((p) => ({
            path: `/product/${p.node.handle}`,
            changefreq: "weekly" as const,
            priority: "0.8",
            lastmod: p.node.updatedAt ? p.node.updatedAt.split("T")[0] : today,
          }));
        } catch (e) {
          console.error("Failed to fetch products for sitemap:", e);
        }

        const entries = [...staticEntries, ...productEntries];

        const urls = entries.map((e) => {
          const loc = absoluteUrl(e.path);
          return [
            `  <url>`,
            `    <loc>${loc}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n");
        });

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

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

