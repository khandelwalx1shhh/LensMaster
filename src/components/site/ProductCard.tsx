import { Link } from "@tanstack/react-router";
import { cdnImage, cdnSrcSet } from "@/lib/images";
import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import {
  discountPercent,
  formatPrice,
  getLensOptions,
  getProductCategory,
  requiresPrescription,
  type ShopifyProduct,
} from "@/lib/shopify";
import { LensSelectionDialog } from "./LensSelectionDialog";

export function ProductCard({ product }: { product: ShopifyProduct }) {
  const p = product.node;
  const addItem = useCartStore((s) => s.addItem);
  const [adding, setAdding] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  // First sellable variant, so the card reflects live Shopify availability.
  const variant = p.variants.edges.find((e) => e.node.availableForSale)?.node ?? p.variants.edges[0]?.node;
  const img = p.images.edges[0]?.node;
  const img2 = p.images.edges[1]?.node ?? img;
  const category = getProductCategory(p);
  const needsDialog = !!getLensOptions(category) || requiresPrescription(category);
  const sellable = !!variant?.availableForSale;
  const compareAt = variant?.compareAtPrice ?? p.compareAtPrice ?? null;
  const price = variant?.price ?? p.priceRange.minVariantPrice;
  const off = discountPercent(price, compareAt);

  const doAdd = async () => {
    if (!variant || !sellable) return;
    if (needsDialog) {
      setDialogOpen(true);
      return;
    }
    setAdding(true);
    await addItem({
      product,
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      selectedOptions: variant.selectedOptions ?? [],
    });
    setAdding(false);
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    void doAdd();
  };

  return (
    <>
      <Link to="/product/$handle" params={{ handle: p.handle }} className="group block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-surface">
          {img && (
            <img
              src={cdnImage(img.url, 640)}
              srcSet={cdnSrcSet(img.url)}
              alt={img.altText ?? p.title}
              loading="lazy"
              decoding="async"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 group-hover:opacity-0 ${sellable ? "" : "grayscale-[0.4] opacity-80"}`}
            />
          )}
          {img2 && (
            <img
              src={cdnImage(img2.url, 640)}
              srcSet={cdnSrcSet(img2.url)}
              alt=""
              loading="lazy"
              decoding="async"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          )}

          <div className="absolute left-2 top-2 sm:left-3 sm:top-3 flex flex-col items-start gap-1.5">
            {off !== null && (
              <span className="rounded-full bg-foreground px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-background">
                {off}% off
              </span>
            )}
            {!sellable && (
              <span className="rounded-full bg-background/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur">
                Out of stock
              </span>
            )}
            {sellable && variant?.stockLevel === "LOW_STOCK" && variant.inventoryQuantity !== null && (
              <span className="rounded-full bg-background/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-600 backdrop-blur">
                Only {variant.inventoryQuantity} left
              </span>
            )}
          </div>

          <button
            onClick={handleAdd}
            disabled={!sellable || adding}
            className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-background/90 backdrop-blur flex items-center justify-center opacity-100 sm:opacity-0 sm:translate-y-2 transition-all duration-300 sm:group-hover:opacity-100 sm:group-hover:translate-y-0 hover:bg-foreground hover:text-background disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            aria-label={sellable ? "Add to bag" : "Out of stock"}
          >
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </button>
        </div>
        <div className="mt-3 sm:mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 sm:gap-4">
          <div className="min-w-0">
            {p.vendor && <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground truncate">{p.vendor}</p>}
            <h3 className="mt-0.5 sm:mt-1 text-sm sm:text-[15px] font-medium truncate">{p.title}</h3>
            {p.productType && <p className="mt-0.5 text-[11px] text-muted-foreground truncate">{p.productType}</p>}
          </div>
          <div className="text-right">
            <p className="text-sm sm:text-[15px] font-medium tabular-nums whitespace-nowrap">
              {formatPrice(price.amount, price.currencyCode)}
            </p>
            {compareAt && (
              <p className="text-[11px] text-muted-foreground line-through tabular-nums whitespace-nowrap">
                {formatPrice(compareAt.amount, compareAt.currencyCode)}
              </p>
            )}
          </div>
        </div>
      </Link>
      {variant && needsDialog && (
        <LensSelectionDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          product={product}
          variant={variant}
        />
      )}
    </>
  );
}
