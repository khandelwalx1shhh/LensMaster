import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ProductGrid } from "@/components/site/ProductGrid";
import { ShopFilters, DEFAULT_FILTERS, type Filters, type Category } from "@/components/site/ShopFilters";
import { ArrowUpRight, Tag } from "lucide-react";
import {
  BLUE_CUT_SINGLE_PRICE,
  BLUE_CUT_BUNDLE_PRICE,
  BLUE_CUT_HIGH_POWER_SINGLE_PRICE,
  BLUE_CUT_HIGH_POWER_BUNDLE_PRICE,
  formatPrice,
} from "@/lib/shopify";

const VALID_CATEGORIES: Category[] = ["", "sunglasses", "contacts", "blue-light", "kids", "sports", "prescription"];

const CATEGORY_TITLES: Record<Exclude<Category, "">, { title: string; blurb: string }> = {
  sunglasses: { title: "Sunglasses", blurb: "UV-protection and polarized frames for every day in the sun." },
  contacts: { title: "Contact Lenses", blurb: "Clear, color, solutions and accessories — daily to monthly wear." },
  "blue-light": { title: "Blue Light", blurb: "Screen-relief eyewear engineered for long hours on devices." },
  kids: { title: "Kids", blurb: "Lightweight, durable frames built for play and school." },
  sports: { title: "Sports", blurb: "Performance eyewear for the field, the road and the trail." },
  prescription: { title: "Prescription", blurb: "Everyday clarity in signature Lens Master craftsmanship." },
};

import { absoluteUrl, generateBreadcrumbSchema } from "@/lib/seo";

export const Route = createFileRoute("/shop")({
  validateSearch: (
    s: Record<string, unknown>,
  ): { offer?: string; category?: Category; brand?: string } => ({
    offer: typeof s.offer === "string" ? s.offer : undefined,
    category: (VALID_CATEGORIES.includes(s.category as Category) ? s.category : "") as Category,
    brand: typeof s.brand === "string" ? s.brand : undefined,
  }),
  head: ({ search }) => {
    const isBlueCut = search?.offer === "blue-cut";
    const catKey = search?.category as Exclude<Category, ""> | undefined;
    const catInfo = catKey && CATEGORY_TITLES[catKey] ? CATEGORY_TITLES[catKey] : null;
    const brandName = search?.brand;

    let title = "Shop Eyewear Online — Frames, Sunglasses & Blue Cut | Lens Master";
    let description =
      "Browse premium prescription frames, sunglasses, blue cut glasses, and contact lenses. Free lens fitting & fast delivery from Jaipur's #1 rated optical store.";
    let canonicalPath = "/shop";

    if (isBlueCut) {
      title = "Blue Cut Glasses Offer in Jaipur | Buy 2 @ ₹1,199 | Lens Master";
      description =
        "Exclusive Blue Cut Glasses offer in Jaipur. Get 2 frames with premium anti-glare blue-light filtering lenses at ₹1,199 (1 @ ₹849).";
      canonicalPath = "/shop?offer=blue-cut";
    } else if (brandName) {
      title = `${brandName} Glasses & Eyewear in Jaipur | Buy Online | Lens Master`;
      description = `Explore 100% authentic ${brandName} optical frames and sunglasses at Lens Master Jaipur. In-store fitting and free eye testing in Lalkothi.`;
      canonicalPath = `/shop?brand=${encodeURIComponent(brandName)}`;
    } else if (catInfo) {
      title = `${catInfo.title} Eyewear Online | Lens Master Jaipur`;
      description = `${catInfo.blurb} Available online and in our Lalkothi store in Jaipur.`;
      canonicalPath = `/shop?category=${catKey}`;
    }

    const canonical = absoluteUrl(canonicalPath);
    const breadcrumbs = [
      { name: "Home", path: "/" },
      { name: "Shop", path: "/shop" },
      ...(catInfo ? [{ name: catInfo.title, path: `/shop?category=${catKey}` }] : []),
      ...(brandName ? [{ name: brandName, path: `/shop?brand=${encodeURIComponent(brandName)}` }] : []),
      ...(isBlueCut ? [{ name: "Blue Cut Offer", path: "/shop?offer=blue-cut" }] : []),
    ];

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: canonical },
        { property: "og:type", content: "website" },
      ],
      links: [{ rel: "canonical", href: canonical }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(generateBreadcrumbSchema(breadcrumbs)),
        },
      ],
    };
  },
  component: Shop,
});

function Shop() {
  const search = Route.useSearch();
  const isBlueCutOffer = search.offer === "blue-cut";
  const category = (search.category || "") as Category;
  const brand = search.brand ?? "";
  const query = isBlueCutOffer ? "tag:blue-cut-offer" : undefined;
  const [filters, setFilters] = useState<Filters>({ ...DEFAULT_FILTERS, category, brand });

  // Sync URL category/brand → filters when it changes (e.g. clicking a brand from another page).
  useEffect(() => {
    setFilters((f) => (f.category === category && f.brand === brand ? f : { ...f, category, brand }));
  }, [category, brand]);

  const heading = !isBlueCutOffer && category ? CATEGORY_TITLES[category] : null;

  return (
    <div className="mx-auto max-w-7xl px-5 sm:px-6 md:px-8 pt-8 sm:pt-14 md:pt-20 pb-14 sm:pb-20">
      <div className="mb-8 sm:mb-12 max-w-2xl">
        <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-muted-foreground">
          {isBlueCutOffer ? "Featured Offer" : heading ? "Category" : "All Products"}
        </p>
        <h1 className="mt-3 sm:mt-4 font-display text-4xl sm:text-5xl md:text-6xl font-light tracking-tight">
          {isBlueCutOffer ? "Blue Cut Collection" : heading ? heading.title : "The Collection"}
        </h1>
        <p className="mt-4 sm:mt-6 text-sm sm:text-base text-muted-foreground">
          {isBlueCutOffer
            ? "Screen-safe frames with blue light blocking lenses. Pick one or grab the pair deal."
            : heading
            ? heading.blurb
            : "Frames, sunglasses, contact lenses and everything in between — curated from the world's premier eyewear houses."}
        </p>
      </div>

      {isBlueCutOffer && (
        <div className="mb-10 sm:mb-14 rounded-2xl sm:rounded-3xl bg-foreground text-background px-6 py-8 sm:px-8 sm:py-10 md:px-12 md:py-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-background/60 text-xs uppercase tracking-wider">
                <Tag className="h-3.5 w-3.5" /> Bundle Offer
              </div>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-light tracking-tight">
                1 @ {formatPrice(BLUE_CUT_SINGLE_PRICE)} · 2 @ {formatPrice(BLUE_CUT_BUNDLE_PRICE)}
              </h2>
              <p className="text-sm text-background/70 max-w-md">
                Add any two frames from this collection and the discount is applied automatically at checkout.
                Power above ±4.00: 1 @ {formatPrice(BLUE_CUT_HIGH_POWER_SINGLE_PRICE)} · 2 @ {formatPrice(BLUE_CUT_HIGH_POWER_BUNDLE_PRICE)}.
              </p>
            </div>
            <Link
              to="/shop"
              className="shrink-0 inline-flex items-center justify-center gap-2 rounded-full bg-background text-foreground px-6 py-3 text-sm font-medium hover:bg-background/90 transition"
            >
              View all <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {!isBlueCutOffer && <ShopFilters filters={filters} onChange={setFilters} />}

      <ProductGrid first={48} query={query} filters={isBlueCutOffer ? undefined : filters} />
    </div>
  );
}

