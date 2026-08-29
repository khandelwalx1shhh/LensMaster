import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Loader2, Minus, Plus, ShoppingBag, X, ArrowRight, Sparkles, Pencil } from "lucide-react";
import { useCartStore, type CartItem } from "@/stores/cartStore";
import { toast } from "sonner";
import {
  formatPrice,
  calculateBlueCutBundle,
  BLUE_CUT_BUNDLE_PRICE,
  BLUE_CUT_BUNDLE_DISCOUNT,
  isBlueCutOfferProduct,
  getProductCategory,
  requiresPrescription,
} from "@/lib/shopify";
import { Link, useNavigate } from "@tanstack/react-router";
import { LensSelectionDialog } from "./LensSelectionDialog";


export function CartDrawer() {
  const { isOpen, setOpen, items, isLoading, updateQuantity, removeItem } = useCartStore();
  const navigate = useNavigate();
  const [editItem, setEditItem] = useState<CartItem | null>(null);


  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const currency = items[0]?.price.currencyCode ?? "INR";
  const bundle = calculateBlueCutBundle(items);
  const displaySubtotal = items.reduce((s, i) => s + parseFloat(i.price.amount) * i.quantity, 0);

  // Nudge: one more Blue Cut item unlocks the bundle
  const offerQtyIsOdd = bundle.offerQty % 2 === 1;
  const nudgeSavings = BLUE_CUT_BUNDLE_PRICE > 0 ? BLUE_CUT_BUNDLE_DISCOUNT : 0;

  const checkout = () => {
    setOpen(false);
    navigate({ to: "/checkout" });
  };

  return (
    <>
    <Sheet open={isOpen} onOpenChange={setOpen}>

      <SheetContent hideClose className="w-full sm:max-w-md flex flex-col p-0 gap-0 border-l">
        <SheetTitle className="sr-only">Your Bag</SheetTitle>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-background">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.5} />
            <h2 className="font-display text-lg tracking-tight">
              Your Bag
              {totalItems > 0 && (
                <span className="ml-2 text-sm text-muted-foreground font-sans font-normal">({totalItems})</span>
              )}
            </h2>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-muted/60 hover:bg-muted text-foreground/80 hover:text-foreground transition-colors"
            aria-label="Close cart"
          >
            <X className="h-[15px] w-[15px]" strokeWidth={2} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center">
              <ShoppingBag className="h-8 w-8 text-muted-foreground" strokeWidth={1.25} />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-display text-xl">Your bag is empty</h3>
              <p className="text-sm text-muted-foreground max-w-[240px]">
                Discover our curated collection of premium eyewear.
              </p>
            </div>
            <Button
              onClick={() => setOpen(false)}
              asChild
              className="mt-2 h-11 px-6 rounded-full text-[14px]"
            >
              <Link to="/shop">Explore the Shop</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Blue Cut progress nudge */}
            {offerQtyIsOdd && (
              <div className="px-5 py-3 bg-gradient-to-r from-gold/10 via-gold/5 to-transparent border-b">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="h-4 w-4 text-gold shrink-0 mt-0.5" strokeWidth={1.5} />
                  <p className="text-xs leading-relaxed">
                    Add <span className="font-medium">1 more Blue Cut glass</span> to save{" "}
                    <span className="font-medium text-gold">{formatPrice(nudgeSavings, currency)}</span> with the bundle.
                  </p>
                </div>
              </div>
            )}

            {/* Items */}
            <div className="flex-1 overflow-y-auto">
              <ul className="divide-y">
                {items.map((item) => {
                  const img = item.product.node.images?.edges?.[0]?.node;
                  const lineTotal = parseFloat(item.price.amount) * item.quantity;
                  const isOffer = isBlueCutOfferProduct(item.product.node);
                  const attrs = (item.attributes ?? []).filter((a) => a.value && !a.key.startsWith("_"));
                  const rowKey = item.lineId ?? `${item.variantId}-${JSON.stringify(item.attributes ?? [])}`;
                  return (
                    <li key={rowKey} className="flex gap-4 px-5 py-5">
                      <Link
                        to="/product/$handle"
                        params={{ handle: item.product.node.handle }}
                        onClick={() => setOpen(false)}
                        className="w-[92px] h-[92px] rounded-lg bg-surface overflow-hidden shrink-0 group"
                      >
                        {img && (
                          <img
                            src={img.url}
                            alt={img.altText ?? item.product.node.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        )}
                      </Link>
                      <div className="flex-1 min-w-0 flex flex-col">
                        <div className="flex justify-between gap-3">
                          <div className="min-w-0">
                            <Link
                              to="/product/$handle"
                              params={{ handle: item.product.node.handle }}
                              onClick={() => setOpen(false)}
                              className="text-[14px] font-medium leading-snug line-clamp-2 hover:underline underline-offset-2"
                            >
                              {item.product.node.title}
                            </Link>
                            {item.selectedOptions.length > 0 && (
                              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mt-1">
                                {item.selectedOptions.map((o) => o.value).join(" · ")}
                              </p>
                            )}
                            {attrs.length > 0 && (
                              <ul className="mt-1.5 space-y-0.5">
                                {attrs.map((a) => (
                                  <li key={a.key} className="text-[11px] text-muted-foreground leading-snug">
                                    <span className="text-foreground/70">{a.key}:</span> {a.value}
                                  </li>
                                ))}
                              </ul>
                            )}
                            {isOffer && (
                              <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] uppercase tracking-wider text-gold font-medium">
                                <Sparkles className="h-2.5 w-2.5" strokeWidth={2} />
                                Blue Cut Offer
                              </span>
                            )}
                          </div>
                          <p className="text-[14px] font-medium tabular-nums whitespace-nowrap">
                            {formatPrice(lineTotal, item.price.currencyCode)}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-auto pt-3">
                          <div className="flex items-center border rounded-full h-8">
                            <button
                              onClick={() => item.lineId && updateQuantity(item.lineId, item.quantity - 1)}
                              className="w-8 h-8 flex items-center justify-center hover:bg-muted rounded-l-full transition-colors"
                              aria-label="Decrease"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="px-2 text-[13px] tabular-nums min-w-[28px] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => item.lineId && updateQuantity(item.lineId, item.quantity + 1)}
                              className="w-8 h-8 flex items-center justify-center hover:bg-muted rounded-r-full transition-colors"
                              aria-label="Increase"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <div className="flex items-center gap-3">
                            {requiresPrescription(getProductCategory(item.product.node)) && (
                              <button
                                onClick={() => setEditItem(item)}
                                className="text-[12px] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors inline-flex items-center gap-1"
                              >
                                <Pencil className="h-3 w-3" />
                                Edit power
                              </button>
                            )}
                            <button
                              onClick={() => item.lineId && removeItem(item.lineId)}
                              className="text-[12px] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>


            </div>

            {/* Summary + checkout */}
            <div className="border-t bg-background px-5 pt-4 pb-5 space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums">{formatPrice(displaySubtotal, currency)}</span>
                </div>
                {bundle.eligibleForBundle && (
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-gold flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3" strokeWidth={2} />
                      Blue Cut Bundle
                    </span>
                    <span className="tabular-nums text-gold">− {formatPrice(bundle.bundleDiscount, currency)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="tabular-nums">{formatPrice(99, currency)}</span>
                </div>
              </div>

              <div className="flex items-end justify-between pt-3 border-t">
                <span className="text-[13px] uppercase tracking-wider text-muted-foreground">Total</span>
                <div className="text-right">
                  <div className="font-display text-2xl tabular-nums leading-none">
                    {formatPrice(bundle.finalTotal + 99, currency)}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                    Incl. of all taxes & ₹99 delivery
                  </div>
                </div>
              </div>

              <Button
                onClick={checkout}
                disabled={isLoading}
                className="w-full h-12 rounded-full text-[14px] font-medium group"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Secure Checkout
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </Button>

              <button
                onClick={() => setOpen(false)}
                className="w-full text-center text-[12px] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
              >
                Continue shopping
              </button>
            </div>
          </>
        )}
      </SheetContent>
      </Sheet>

      {editItem && (
        <LensSelectionDialog
          open={!!editItem}
          onOpenChange={(v) => !v && setEditItem(null)}
          product={editItem.product}
          variant={{
            id: editItem.variantId,
            title: editItem.variantTitle,
            sku: null,
            price: editItem.price,
            compareAtPrice: null,
            availableForSale: true,
            inventoryQuantity: null,
            stockLevel: "IN_STOCK",
            selectedOptions: editItem.selectedOptions,
          }}
          editLineId={editItem.lineId}
          initialAttributes={editItem.attributes ?? []}
        />
      )}
    </>
  );
}

