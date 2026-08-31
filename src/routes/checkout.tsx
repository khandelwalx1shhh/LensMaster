import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Loader2, Lock, ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  formatPrice,
  calculateBlueCutBundle,
  isBlueCutOfferProduct,
  BLUE_CUT_BUNDLE_DISCOUNT,
} from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";
import { checkoutSchema } from "@/lib/validation";

export const Route = createFileRoute("/checkout")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Secure Checkout — Lens Master" },
      {
        name: "description",
        content:
          "Complete your Lens Master order securely. Pay by UPI, card, net banking or wallet with flat ₹99 delivery across India.",
      },
      { property: "og:title", content: "Secure Checkout — Lens Master" },
      {
        property: "og:description",
        content: "Complete your Lens Master eyewear order with a secure Paytm payment.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CheckoutPage,
});

const DELIVERY_FEE = 99;

interface FormState {
  name: string;
  phone: string;
  email: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
}

const EMPTY: FormState = {
  name: "",
  phone: "",
  email: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
};

function CheckoutPage() {
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const [form, setForm] = useState<FormState>({ ...EMPTY });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [pinLookup, setPinLookup] = useState<"idle" | "loading" | "done" | "error">("idle");
  const lastPinRef = useRef("");

  const currency = items?.[0]?.price?.currencyCode ?? "INR";
  const bundle = calculateBlueCutBundle(items ?? []);
  const subtotal = (items ?? []).reduce(
    (s, i) => s + parseFloat(i?.price?.amount || "0") * (i?.quantity || 1),
    0,
  );
  const total = (bundle?.finalTotal || 0) + DELIVERY_FEE;

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  // Auto-detect city + state from a valid 6-digit Indian PIN code.
  useEffect(() => {
    const pin = form.pincode.trim();
    if (!/^\d{6}$/.test(pin)) {
      lastPinRef.current = "";
      setPinLookup("idle");
      return;
    }
    if (lastPinRef.current === pin) return;
    lastPinRef.current = pin;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setPinLookup("loading");
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("LOOKUP_FAILED");
        const json = (await res.json()) as Array<{
          Status?: string;
          PostOffice?: Array<{ District?: string; State?: string }> | null;
        }>;
        const office = json?.[0]?.Status === "Success" ? json[0]?.PostOffice?.[0] : undefined;
        const city = String(office?.District ?? "").slice(0, 60);
        const state = String(office?.State ?? "").slice(0, 60);
        if (!city || !state) {
          setPinLookup("error");
          return;
        }
        setForm((f) => (f.pincode.trim() === pin ? { ...f, city, state } : f));
        setErrors((prev) => ({ ...prev, city: undefined, state: undefined, pincode: undefined }));
        setPinLookup("done");
      } catch (error) {
        if ((error as Error)?.name === "AbortError") return;
        setPinLookup("error");
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [form.pincode]);


  const validate = () => {
    const result = checkoutSchema.safeParse(form);
    if (result.success) {
      setErrors({});
      return true;
    }
    const next: Partial<Record<keyof FormState, string>> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0] as keyof FormState;
      if (key && !next[key]) next[key] = issue.message;
    }
    setErrors(next);
    return false;
  };

  /** Loads Razorpay's hosted checkout script once. */
  const loadRazorpay = () =>
    new Promise<boolean>((resolve) => {
      if (typeof window === "undefined") return resolve(false);
      if ((window as unknown as { Razorpay?: unknown }).Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const pay = async () => {
    if (!items.length || submitting) return;
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: items.map((i) => {
            const prod = (i?.product as any)?.node ?? i?.product;
            return {
              variantId: i.variantId,
              quantity: i.quantity || 1,
              unitPrice: parseFloat(i.price?.amount || "0"),
              title: prod?.title || "Item",
              variantTitle: i.variantTitle || "",
              blueCutOffer: isBlueCutOfferProduct(prod),
              attributes: i.attributes ?? [],
            };
          }),
          customer: {
            name: form.name.trim(),
            phone: form.phone.trim(),
            email: form.email.trim(),
          },
          address: {
            line1: form.line1.trim(),
            line2: form.line2.trim(),
            city: form.city.trim(),
            state: form.state.trim(),
            pincode: form.pincode.trim(),
          },
        }),
      });

      if (!res.ok) throw new Error("ORDER_FAILED");
      const data = (await res.json()) as {
        orderId?: string;
        order_id?: string;
        receipt: string;
        keyId?: string;
        key_id?: string;
        amount: number;
        currency: string;
      };
      const razorpayOrderId = data.order_id || data.orderId;
      const razorpayKey =
        data.key_id ||
        data.keyId ||
        (import.meta.env.VITE_RAZORPAY_KEY_ID as string) ||
        "";

      if (!razorpayOrderId || !razorpayKey) throw new Error("ORDER_FAILED");

      const ready = await loadRazorpay();
      if (!ready) throw new Error("SDK_FAILED");

      try {
        sessionStorage.setItem("lm:lastOrderId", data.receipt);
      } catch {
        /* storage may be unavailable — not critical */
      }

      const RazorpayCtor = (
        window as unknown as {
          Razorpay: new (o: unknown) => {
            open: () => void;
            on: (event: string, handler: (response: any) => void) => void;
          };
        }
      ).Razorpay;

      const rzp = new RazorpayCtor({
        key: razorpayKey,
        order_id: razorpayOrderId,
        amount: Math.round(data.amount * 100),
        currency: data.currency || "INR",
        name: "Lens Master",
        description: `Order ${data.receipt}`,
        prefill: {
          name: form.name.trim(),
          contact: form.phone.trim(),
          ...(form.email.trim() ? { email: form.email.trim() } : {}),
        },
        notes: { receipt: data.receipt },
        theme: { color: "#D4AF37" },
        modal: {
          ondismiss: () => {
            setSubmitting(false);
            toast.info("Payment cancelled", {
              description: "You can retry checkout whenever you are ready.",
            });
          },
        },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });
            const verifyJson = (await verifyRes.json()) as {
              verified?: boolean;
              success?: boolean;
            };
            const isVerified = Boolean(verifyJson.verified || verifyJson.success);
            const query = new URLSearchParams({
              status: isVerified ? "TXN_SUCCESS" : "INVALID",
              orderId: data.receipt,
              txnId: response.razorpay_payment_id,
              amount: String(data.amount),
            });
            window.location.assign(`/order-status?${query.toString()}`);
          } catch (err) {
            console.error("[checkout] payment verification failed", err);
            window.location.assign(
              `/order-status?status=UNKNOWN&orderId=${data.receipt}&txnId=${response.razorpay_payment_id}`,
            );
          }
        },
      });

      // Handle payment.failed event
      rzp.on("payment.failed", (response: {
        error?: {
          code?: string;
          description?: string;
          source?: string;
          step?: string;
          reason?: string;
        };
      }) => {
        console.error("[checkout] Razorpay payment failure:", response.error);
        toast.error("Payment failed", {
          description:
            response.error?.description ||
            "The payment could not be processed. Please try another method or retry.",
        });
        setSubmitting(false);
      });

      rzp.open();
    } catch (error) {
      console.error("[checkout] payment initiation failed", error);
      toast.error("We couldn't start the payment", {
        description: "Please try again in a moment, or message us on WhatsApp.",
      });
      setSubmitting(false);
    }
  };

  if (!items.length) {
    return (
      <section className="mx-auto max-w-2xl px-5 py-24 text-center">
        <h1 className="font-display text-3xl tracking-tight">Your bag is empty</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Add a frame or lens to continue to checkout.
        </p>
        <Button asChild className="mt-8 h-12 rounded-full px-8">
          <Link to="/shop">Browse the collection</Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
      <button
        onClick={() => navigate({ to: "/shop" })}
        className="inline-flex items-center gap-1.5 text-[12px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
        Continue shopping
      </button>

      <h1 className="mt-4 font-display text-3xl sm:text-4xl tracking-tight">Checkout</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Delivery details, then a secure payment by UPI, card, net banking or wallet.
      </p>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.3fr_1fr]">
        <section className="space-y-5">
          <h2 className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground">
            Delivery details
          </h2>

          <Field id="name" label="Full name" value={form.name} onChange={set("name")} error={errors.name} autoComplete="name" />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              id="phone"
              label="Mobile number"
              value={form.phone}
              onChange={set("phone")}
              error={errors.phone}
              inputMode="numeric"
              maxLength={10}
              autoComplete="tel-national"
            />
            <Field
              id="email"
              label="Email (optional)"
              value={form.email}
              onChange={set("email")}
              error={errors.email}
              type="email"
              autoComplete="email"
            />
          </div>
          <Field id="line1" label="Address" value={form.line1} onChange={set("line1")} error={errors.line1} autoComplete="address-line1" />
          <Field
            id="line2"
            label="Landmark / apartment (optional)"
            value={form.line2}
            onChange={set("line2")}
            autoComplete="address-line2"
          />
          <div className="grid gap-5 sm:grid-cols-3">
            <div className="space-y-1">
              <Field
                id="pincode"
                label="PIN code"
                value={form.pincode}
                onChange={set("pincode")}
                error={errors.pincode}
                inputMode="numeric"
                maxLength={6}
                autoComplete="postal-code"
              />
              {pinLookup === "loading" && (
                <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> Detecting city &amp; state…
                </p>
              )}
              {pinLookup === "error" && (
                <p className="text-[11px] text-muted-foreground">
                  Couldn&apos;t detect — please enter city and state.
                </p>
              )}
            </div>
            <Field id="city" label="City" value={form.city} onChange={set("city")} error={errors.city} autoComplete="address-level2" />
            <Field id="state" label="State" value={form.state} onChange={set("state")} error={errors.state} autoComplete="address-level1" />
          </div>

        </section>

        <aside className="lg:sticky lg:top-24 h-fit rounded-2xl border bg-card p-5">
          <h2 className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground">
            Order summary
          </h2>

          <ul className="mt-4 space-y-3">
            {items.map((item) => {
              const prod = (item?.product as any)?.node ?? item?.product;
              const isOffer = isBlueCutOfferProduct(prod);
              const unitPrice = parseFloat(item?.price?.amount || "0");
              const qty = item?.quantity || 1;
              const lineTotal = unitPrice * qty;
              const hasPairDiscount = isOffer && qty >= 2;
              const pairDiscount = hasPairDiscount
                ? Math.floor(qty / 2) * BLUE_CUT_BUNDLE_DISCOUNT
                : 0;

              return (
                <li
                  key={item?.lineId ?? item?.variantId}
                  className="flex items-start justify-between gap-3 text-[13px]"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{prod?.title || "Item"}</span>
                    <span className="text-muted-foreground text-xs">Qty {qty}</span>
                    {isOffer && (
                      <span className="block text-[10px] uppercase font-semibold text-gold tracking-wider mt-0.5">
                        ✨ Blue Cut Offer
                      </span>
                    )}
                  </span>
                  <span className="tabular-nums shrink-0 text-right">
                    {hasPairDiscount ? (
                      <div>
                        <span className="block text-[11px] text-muted-foreground line-through">
                          {formatPrice(lineTotal, currency)}
                        </span>
                        <span className="font-semibold text-gold">
                          {formatPrice(lineTotal - pairDiscount, currency)}
                        </span>
                      </div>
                    ) : (
                      <span>{formatPrice(lineTotal, currency)}</span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="mt-5 space-y-1.5 border-t pt-4 text-[13px]">
            <Row label="Subtotal" value={formatPrice(subtotal, currency)} />
            {bundle.eligibleForBundle && (
              <Row
                label="Blue Cut Pair Discount"
                value={`− ${formatPrice(bundle.bundleDiscount, currency)}`}
                gold
              />
            )}
            <Row label="Delivery" value={formatPrice(DELIVERY_FEE, currency)} />
          </div>

          <div className="mt-4 flex items-end justify-between border-t pt-4">
            <div>
              <span className="text-[12px] uppercase tracking-wider text-muted-foreground block">
                Total
              </span>
              {bundle.eligibleForBundle && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">
                  You save {formatPrice(bundle.bundleDiscount, currency)}!
                </span>
              )}
            </div>
            <div className="text-right">
              {bundle.eligibleForBundle && (
                <div className="text-xs text-muted-foreground line-through tabular-nums mb-0.5">
                  {formatPrice(subtotal + DELIVERY_FEE, currency)}
                </div>
              )}
              <span className="font-display text-2xl tabular-nums leading-none">
                {formatPrice(total, currency)}
              </span>
            </div>
          </div>

          <Button onClick={pay} disabled={submitting} className="mt-5 w-full h-12 rounded-full text-[14px]">
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" strokeWidth={1.75} />
                Pay {formatPrice(total, currency)}
              </>
            )}
          </Button>

          <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 mt-px shrink-0" strokeWidth={1.5} />
            Payments are processed securely by Razorpay. The final amount is verified on our
            server before payment.
          </p>
        </aside>
      </div>
    </section>
  );
}

function Row({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={gold ? "text-gold" : "text-muted-foreground"}>{label}</span>
      <span className={`tabular-nums ${gold ? "text-gold" : ""}`}>{value}</span>
    </div>
  );
}

function Field({
  id,
  label,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; error?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-[12px] text-muted-foreground">
        {label}
      </Label>
      <Input id={id} aria-invalid={!!error} className="h-11 rounded-xl" {...props} />
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}
