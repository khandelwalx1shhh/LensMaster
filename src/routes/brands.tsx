import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ProductGrid } from "@/components/site/ProductGrid";
import { ShopFilters, DEFAULT_FILTERS, type Filters } from "@/components/site/ShopFilters";


export const Route = createFileRoute("/brands")({
  head: () => ({
    meta: [
      { title: "Designer Eyewear Brands — Ray-Ban, Gucci, Prada & More | Lens Master" },
      { name: "description", content: "Shop Ray-Ban, Gucci, Oakley, Tom Ford, Prada, Carrera, Armani, Vogue, Calvin Klein and more at Lens Master Jaipur. Authorised dealer." },
      { property: "og:title", content: "Designer Eyewear Brands — Lens Master" },
      { property: "og:description", content: "The world's premier eyewear houses, curated in Jaipur." },
      { property: "og:url", content: "/brands" },
    ],
    links: [{ rel: "canonical", href: "/brands" }],
  }),
  component: Brands,
});




function Brands() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  return (
    <div className="mx-auto max-w-7xl px-5 sm:px-6 md:px-8 pt-8 sm:pt-14 md:pt-20 pb-14 sm:pb-20">
      <div className="max-w-2xl">
        <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-muted-foreground">Designer Eyewear</p>
        <h1 className="mt-3 sm:mt-4 font-display text-4xl sm:text-5xl md:text-6xl font-light tracking-tight">Branded frames &amp; lenses.</h1>
        <p className="mt-4 sm:mt-6 text-sm sm:text-base text-muted-foreground">
          Authentic pieces from the world&rsquo;s leading eyewear labels &mdash; sourced directly, never replicas. Filter by brand to find yours.
        </p>

      </div>

      <div className="mt-8 sm:mt-12">
        <ShopFilters filters={filters} onChange={setFilters} />
        <ProductGrid first={48} filters={filters} />
      </div>

    </div>
  );

}
