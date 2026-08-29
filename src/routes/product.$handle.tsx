import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, Loader2, Truck, ShieldCheck } from "lucide-react";
import {
  discountPercent,
  fetchProductByHandle,
  formatPrice,
  getLensOptions,
  getProductCategory,
  requiresPrescription,
  variantStockLabel,
  type ShopifyVariant,
} from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";
import { LensSelectionDialog } from "@/components/site/LensSelectionDialog";
import { ReviewsSection } from "@/components/site/ReviewsSection";
import { reportLovableError } from "@/lib/lovable-error-reporting";
import { sanitizeHtml } from "@/lib/sanitize";

export const Route = createFileRoute("/product/$handle")({
  loader: ({ params }) => fetchProductByHandle(params.handle),
  head: ({ loaderData, params }) => {
    const p = loaderData as { title?: string; description?: string; images?: { edges: Array<{ node: { url: string; altText: string | null } }> }; priceRange?: { minVariantPrice: { amount: string; currencyCode: string } }; vendor?: string; handle?: string } | null;
    if (!p) {
      return { meta: [{ title: "Product — Lens Master" }] };
    }
    const image = p.images?.edges[0]?.node.url;
    const title = `${p.title} — Buy Online at Lens Master`;
    const description = (p.description || `Shop ${p.title} at Lens Master, Jaipur. Premium eyewear with precision lenses and free power fitting.`).slice(0, 160);
    const canonical = `/product/${params.handle}`;
    const meta: Array<Record<string, string>> = [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: p.title || "Lens Master" },
      { property: "og:description", content: description },
      { property: "og:type", content: "product" },
      { property: "og:url", content: canonical },
      { name: "twitter:card", content: "summary_large_image" },
    ];
    if (image) {
      meta.push({ property: "og:image", content: image });
      meta.push({ name: "twitter:image", content: image });
    }
    const inStock = Array.isArray((p as { variants?: { edges: Array<{ node: { availableForSale: boolean } }> } }).variants?.edges)
      ? (p as { variants: { edges: Array<{ node: { availableForSale: boolean } }> } }).variants.edges.some((e) => e.node.availableForSale)
      : false;
    const scripts = p.priceRange ? [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Product",
        name: p.title,
        description,
        image: image ? [image] : undefined,
        brand: p.vendor ? { "@type": "Brand", name: p.vendor } : undefined,
        offers: {
          "@type": "Offer",
          priceCurrency: p.priceRange.minVariantPrice.currencyCode,
          price: p.priceRange.minVariantPrice.amount,
          availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        },
      }),
    }] : undefined;
    return { meta, links: [{ rel: "canonical", href: canonical }], scripts };
  },
  component: ProductPage,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    useEffect(() => reportLovableError(error, { boundary: "product_route" }), [error]);
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-6">
        <h2 className="font-display text-2xl">We couldn't load this product</h2>
        <div className="flex gap-3">
          <button onClick={() => { router.invalidate(); reset(); }} className="rounded-full bg-foreground text-background px-6 py-2.5 text-sm">
            Try again
          </button>
          <Link to="/shop" className="rounded-full border border-border px-6 py-2.5 text-sm">Back to shop</Link>
        </div>
      </div>
    );
  },
  notFoundComponent: () => (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-6 text-center">
      <h2 className="font-display text-3xl">Product not found</h2>
      <Link to="/shop" className="rounded-full bg-foreground text-background px-6 py-2.5 text-sm">Back to shop</Link>
    </div>
  ),
});

function ProductPage() {
  const { handle } = Route.useParams();
  const { data: product, isLoading, isError } = useQuery({
    queryKey: ["product", handle],
    queryFn: () => fetchProductByHandle(handle),
  });

  const [activeImg, setActiveImg] = useState(0);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    if (product && !variantId) setVariantId(product.variants.edges[0]?.node.id ?? null);
  }, [product, variantId]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex justify-center items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (isError) throw new Error("Failed to load product");
  if (!product) throw notFound();

  const images: Array<{ url: string; altText: string | null }> = product.images.edges.map((e: { node: { url: string; altText: string | null } }) => e.node);
  const variants: ShopifyVariant[] = product.variants.edges.map((e) => e.node);
  const current = variants.find((v) => v.id === variantId) ?? variants[0];
  const category = getProductCategory(product);
  const needsDialog = !!getLensOptions(category) || requiresPrescription(category);

  const handleAdd = async () => {
    if (!current) return;
    if (needsDialog) {
      setDialogOpen(true);
      return;
    }
    setAdding(true);
    await addItem({
      product: { node: product },
      variantId: current.id,
      variantTitle: current.title,
      price: current.price,
      quantity: 1,
      selectedOptions: current.selectedOptions ?? [],
    });
    setAdding(false);
  };

  return (
    <div className="mx-auto max-w-7xl px-5 sm:px-6 md:px-8 pt-6 sm:pt-10 md:pt-16 pb-16 sm:pb-24">
      <Link to="/shop" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 sm:mb-8">
        <ChevronLeft className="h-4 w-4" /> Back to shop
      </Link>

      <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16">
        <div>
          <ZoomImage
            src={images[activeImg]?.url}
            alt={images[activeImg]?.altText ?? product.title}
          />
          {images.length > 1 && (
            <div className="mt-3 sm:mt-4 grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-3">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`aspect-square rounded-lg overflow-hidden bg-surface border-2 transition ${
                    activeImg === i ? "border-foreground" : "border-transparent"
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:pt-4">
          {product.vendor && <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-muted-foreground">{product.vendor}</p>}
          <h1 className="mt-2 sm:mt-3 font-display text-2xl sm:text-3xl md:text-4xl font-light tracking-tight">{product.title}</h1>
          {current && (
            <>
              <div className="mt-4 sm:mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <p className="text-xl sm:text-2xl font-medium tabular-nums">
                  {formatPrice(current.price.amount, current.price.currencyCode)}
                </p>
                {current.compareAtPrice && (
                  <p className="text-base text-muted-foreground line-through tabular-nums">
                    {formatPrice(current.compareAtPrice.amount, current.compareAtPrice.currencyCode)}
                  </p>
                )}
                {discountPercent(current.price, current.compareAtPrice) !== null && (
                  <span className="rounded-full bg-foreground/5 px-2.5 py-1 text-xs font-medium">
                    {discountPercent(current.price, current.compareAtPrice)}% off
                  </span>
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                <span
                  className={
                    current.availableForSale
                      ? current.stockLevel === "LOW_STOCK"
                        ? "font-medium text-amber-600"
                        : "font-medium text-emerald-600"
                      : "font-medium text-muted-foreground"
                  }
                >
                  {variantStockLabel(current)}
                </span>
                {current.sku && <span className="text-muted-foreground">SKU {current.sku}</span>}
              </div>
            </>
          )}

          {product.descriptionHtml ? (
            <div
              className="mt-6 sm:mt-8 text-muted-foreground leading-relaxed text-sm prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.descriptionHtml) }}
            />
          ) : product.description ? (
            <p className="mt-6 sm:mt-8 text-muted-foreground leading-relaxed text-sm">{product.description}</p>
          ) : null}

          {variants.length > 1 && (
            <div className="mt-6 sm:mt-8">
              <p className="text-sm font-medium mb-3">Options</p>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setVariantId(v.id)}
                    disabled={!v.availableForSale}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      variantId === v.id ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/40"
                    } disabled:opacity-40 disabled:line-through`}
                  >
                    {v.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleAdd}
            disabled={!current?.availableForSale || adding}
            className="mt-8 sm:mt-10 w-full h-14 rounded-full bg-foreground text-background text-[15px] font-medium hover:bg-foreground/90 transition disabled:opacity-50 flex items-center justify-center"
          >
            {adding ? <Loader2 className="h-5 w-5 animate-spin" /> : current?.availableForSale ? "Add to bag" : "Sold out"}
          </button>

          <div className="mt-8 sm:mt-10 space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <Truck className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <div><span className="font-medium">Flat ₹99 delivery</span> across India — fast & tracked</div>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <div><span className="font-medium">Quality inspected</span> — precision power fitted by certified opticians</div>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <div><span className="font-medium">Authenticity guaranteed</span> — 100% genuine luxury optical wear</div>
            </div>
          </div>
        </div>
      </div>
      <ReviewsSection />
      {current && needsDialog && (
        <LensSelectionDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          product={{ node: product }}
          variant={current}
        />
      )}
    </div>
  );
}

function ZoomImage({ src, alt }: { src?: string; alt: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  if (!src) return <div className="aspect-square rounded-2xl bg-surface" />;
  return (
    <div
      ref={ref}
      onMouseMove={(e) => {
        const r = ref.current!.getBoundingClientRect();
        setPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
      }}
      onMouseLeave={() => setPos(null)}
      className="aspect-square rounded-2xl overflow-hidden bg-surface cursor-zoom-in relative"
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover transition-transform duration-200 will-change-transform"
        style={pos ? { transform: "scale(2)", transformOrigin: `${pos.x}% ${pos.y}%` } : undefined}
      />
    </div>
  );
}
