import { useQuery } from "@tanstack/react-query";
import { fetchProducts } from "@/lib/shopify";
import { ProductCard } from "./ProductCard";
import { ProductGridSkeleton } from "./ProductGridSkeleton";
import { Sparkles } from "lucide-react";
import { applyFilters, type Filters } from "./ShopFilters";

interface Props {
  first?: number;
  query?: string;
  filters?: Filters;
  excludeHouseBrands?: boolean;
}

export function ProductGrid({ first = 12, query, filters, excludeHouseBrands }: Props) {
  const { data: products = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["products", first, query ?? null],
    queryFn: () => fetchProducts(first, query),
  });

  if (isLoading) return <ProductGridSkeleton count={Math.min(first, 8)} />;

  if (isError) {
    return (
      <div className="mx-auto max-w-xl text-center py-20 px-6">
        <div className="mx-auto h-12 w-12 rounded-full bg-surface flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-muted-foreground" />
        </div>
        <h3 className="mt-6 font-display text-2xl">We couldn't load the collection</h3>
        <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
          This is on us, not you. Please try again in a moment.
        </p>
        <button
          onClick={() => refetch()}
          className="mt-6 inline-flex items-center justify-center rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition hover:bg-foreground/90"
        >
          Try again
        </button>
      </div>
    );
  }

  const filtered = filters
    ? applyFilters(products, filters, { excludeHouseBrands })
    : excludeHouseBrands
      ? products.filter((p) => !applyFilters([p], { ...filters } as Filters, { excludeHouseBrands }).length)
      : products;


  if (!filtered.length) {
    return (
      <div className="mx-auto max-w-xl text-center py-24 px-6">
        <div className="mx-auto h-12 w-12 rounded-full bg-surface flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-muted-foreground" />
        </div>
        <h3 className="mt-6 font-display text-2xl">
          {products.length ? "No matches" : "No products yet"}
        </h3>
        <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
          {products.length
            ? "Try clearing a filter to see more frames."
            : "New pieces are arriving shortly. Check back soon or message us on WhatsApp."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-4 sm:gap-y-10 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
      {filtered.map((p) => (
        <ProductCard key={p.node.id} product={p} />
      ))}
    </div>
  );
}
