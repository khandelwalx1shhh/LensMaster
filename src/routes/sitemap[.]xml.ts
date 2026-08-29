import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { fetchProducts } from "@/lib/shopify";

// TODO: replace with your project URL once a project name or custom domain is set.
const BASE_URL = "";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const staticEntries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/shop", changefreq: "daily", priority: "0.9" },
          { path: "/shop?category=prescription", changefreq: "weekly", priority: "0.8" },
          { path: "/shop?category=sunglasses", changefreq: "weekly", priority: "0.8" },
          { path: "/shop?category=blue-light", changefreq: "weekly", priority: "0.8" },
          { path: "/shop?category=contacts", changefreq: "weekly", priority: "0.8" },
          { path: "/shop?category=kids", changefreq: "weekly", priority: "0.7" },
          { path: "/shop?category=sports", changefreq: "weekly", priority: "0.7" },
          { path: "/shop?offer=blue-cut", changefreq: "weekly", priority: "0.8" },
          { path: "/brands", changefreq: "monthly", priority: "0.7" },
          { path: "/stores", changefreq: "monthly", priority: "0.8" },
          { path: "/about", changefreq: "monthly", priority: "0.6" },
        ];

        const productEntries: SitemapEntry[] = await fetchProducts(100)
          .then((products) =>
            products.map((p) => ({
              path: `/product/${p.node.handle}`,
              changefreq: "weekly" as const,
              priority: "0.7",
            })),
          )
          .catch(() => []);

        const entries = [...staticEntries, ...productEntries];

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});

