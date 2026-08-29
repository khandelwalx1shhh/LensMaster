import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, XCircle, AlertTriangle, Package, Truck, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartStore } from "@/stores/cartStore";
import { getOrderByNumber, type OrderDetails } from "@/lib/orders.functions";

function cleanOrderId(v: unknown): string {
  return String(v ?? "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 60);
}

export const Route = createFileRoute("/order-status")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    orderId: cleanOrderId(search.orderId),
  }),
  head: () => ({
    meta: [
      { title: "Order Status — Lens Master" },
      {
        name: "description",
        content: "Your Lens Master payment result and order reference.",
      },
      { property: "og:title", content: "Order Status — Lens Master" },
      { property: "og:description", content: "Your Lens Master payment result and order reference." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: OrderStatusPage,
});

function OrderStatusPage() {
  const { orderId } = Route.useSearch();
  // Phone is kept in component state (never in the URL) and is what proves
  // ownership server-side before full address / prescription data is returned.
  const [phone, setPhone] = useState("");
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const {
    data: order,
    isPending,
    isError,
  } = useQuery<OrderDetails | null>({
    queryKey: ["order-status", orderId || "lookup", verifiedPhone],
    queryFn: async () => {
      if (!orderId) return null;
      return getOrderByNumber({
        data: { orderNumber: orderId, phone: verifiedPhone || undefined },
      });
    },
    enabled: !!orderId,
    staleTime: 60_000,
  });
  const clearCart = useCartStore((s) => s.clearCart);
  const paid = order?.payment_status === "paid";

  // Hooks must run on every render — keep this above the early returns.
  useEffect(() => {
    if (paid) clearCart();
  }, [paid, clearCart]);

  if (!orderId) {
    return <OrderLookupForm />;
  }

  if (isPending) {
    return (
      <section className="mx-auto max-w-xl px-5 py-20 text-center">
        <Package className="mx-auto h-12 w-12 text-muted-foreground animate-pulse" strokeWidth={1.25} />
        <h1 className="mt-6 font-display text-3xl tracking-tight">Loading order…</h1>
      </section>
    );
  }

  if (isError || !order) {
    return (
      <section className="mx-auto max-w-xl px-5 py-20 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground" strokeWidth={1.25} />
        <h1 className="mt-6 font-display text-3xl sm:text-4xl tracking-tight">Order not found</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          We couldn't locate that order reference. Please check the order number and try again.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild className="h-12 rounded-full px-8 w-full sm:w-auto">
            <Link to="/">Back to home</Link>
          </Button>
          <Button asChild variant="outline" className="h-12 rounded-full px-8 w-full sm:w-auto">
            <Link to="/shop">Continue shopping</Link>
          </Button>
        </div>
      </section>
    );
  }

  const success = paid;
  const Icon = success ? CheckCircle2 : order.payment_status === "failed" ? XCircle : AlertTriangle;
  const bundleDiscount = Math.max(0, order.subtotal + order.delivery_fee - order.total);


  const heading = success
    ? "Payment received"
    : order.payment_status === "failed"
      ? "Payment not completed"
      : "We are confirming your payment";

  const copy = success
    ? "Thank you. Our team will confirm your prescription and lens details on WhatsApp shortly."
    : order.payment_status === "failed"
      ? "No money was taken. Your bag is still saved — you can try the payment again."
      : "If money left your account, message us on WhatsApp with the reference below and we'll sort it out immediately.";

  return (
    <section className="mx-auto max-w-2xl px-5 py-12 sm:py-20">
      <div className="text-center">
        <Icon
          className={`mx-auto h-12 w-12 ${success ? "text-gold" : "text-muted-foreground"}`}
          strokeWidth={1.25}
        />
        <h1 className="mt-6 font-display text-3xl sm:text-4xl tracking-tight">{heading}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground max-w-md mx-auto">{copy}</p>
      </div>

      <div className="mt-8 rounded-2xl border bg-card overflow-hidden">
        <div className="p-5 border-b bg-surface/30">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Order reference</p>
              <p className="font-display text-lg">{order.order_number}</p>
            </div>
            <StatusBadge status={order.status} />
          </div>
        </div>

        <div className="p-5 space-y-4">
          <h2 className="font-medium text-sm">Items</h2>
          <ul className="space-y-3">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-4 text-sm">
                <div className="min-w-0">
                  <p className="font-medium truncate">{item.title}</p>
                  {item.variant_title && (
                    <p className="text-xs text-muted-foreground truncate">{item.variant_title}</p>
                  )}
                  {item.prescription && (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {formatRx(item.prescription)}
                    </p>
                  )}
                </div>
                <div className="text-right whitespace-nowrap">
                  <p className="text-xs text-muted-foreground">Qty {item.quantity}</p>
                  <p className="font-medium">₹{item.price * item.quantity}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="border-t pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>₹{order.subtotal}</span>
            </div>
            {bundleDiscount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Offer discount</span>
                <span className="text-gold">−₹{bundleDiscount}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery</span>
              <span>₹{order.delivery_fee}</span>
            </div>
            <div className="flex justify-between font-display text-base pt-2 border-t">
              <span>Total</span>
              <span>₹{order.total}</span>
            </div>
          </div>
        </div>

        {order.redacted ? (
          <div className="p-5 border-t bg-surface/30 text-sm">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Delivery &amp; prescription details
            </p>
            <p className="mt-2 text-muted-foreground">
              For your privacy, we only show these to the person who placed the order. Enter the
              mobile number used at checkout ({order.customer_phone}) to unlock them.
            </p>
            <form
              className="mt-4 flex flex-col sm:flex-row gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                const cleaned = phone.replace(/\D/g, "").slice(-10);
                if (/^[6-9]\d{9}$/.test(cleaned)) setVerifiedPhone(cleaned);
              }}
            >
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="numeric"
                maxLength={10}
                placeholder="10-digit mobile number"
                className="h-11 rounded-full px-5"
                autoComplete="tel"
              />
              <Button type="submit" className="h-11 rounded-full px-6">
                Unlock details
              </Button>
            </form>
            {verifiedPhone && (
              <p className="mt-2 text-xs text-red-600">
                That number doesn't match this order.
              </p>
            )}
          </div>
        ) : (
        <div className="p-5 border-t bg-surface/30 text-sm space-y-2">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Delivery address</p>
          <p className="font-medium">{order.customer_name}</p>
          <p className="text-muted-foreground">
            {order.address_line1}
            {order.address_line2 ? `, ${order.address_line2}` : ""}
            <br />
            {order.city}, {order.state} — {order.pincode}
          </p>
          <p className="text-muted-foreground pt-1">{order.customer_phone}</p>
        </div>
        )}
      </div>

      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button asChild className="h-12 rounded-full px-8 w-full sm:w-auto">
          <Link to="/shop">{success ? "Continue shopping" : "Back to the collection"}</Link>
        </Button>
        {!success && (
          <Button asChild variant="outline" className="h-12 rounded-full px-8 w-full sm:w-auto">
            <Link to="/checkout">Try payment again</Link>
          </Button>
        )}
      </div>

      <div className="mt-10 grid sm:grid-cols-2 gap-4 text-sm">
        <div className="rounded-2xl border p-5 flex items-start gap-3">
          <Package className="h-5 w-5 text-muted-foreground shrink-0" strokeWidth={1.5} />
          <div>
            <p className="font-medium">Order updates</p>
            <p className="text-xs text-muted-foreground mt-1">
              We'll WhatsApp you when your order is packed and shipped.
            </p>
          </div>
        </div>
        <div className="rounded-2xl border p-5 flex items-start gap-3">
          <Truck className="h-5 w-5 text-muted-foreground shrink-0" strokeWidth={1.5} />
          <div>
            <p className="font-medium">Delivery</p>
            <p className="text-xs text-muted-foreground mt-1">
              Standard delivery within 5–7 working days across India.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "delivered"
      ? "bg-green-100 text-green-800"
      : status === "cancelled"
        ? "bg-red-100 text-red-800"
        : status === "shipped"
          ? "bg-blue-100 text-blue-800"
          : "bg-gold/10 text-gold";
  return (
    <span className={`text-[10px] uppercase tracking-wider px-3 py-1 rounded-full ${styles}`}>
      {status}
    </span>
  );
}

function formatRx(rx: NonNullable<OrderDetails["items"][number]["prescription"]>) {
  const eye = (label: string, sph: number | null, cyl: number | null, axis: number | null, add: number | null) => {
    if (sph === null && cyl === null && axis === null && add === null) return "";
    const parts = [`${label}`];
    if (sph !== null) parts.push(`SPH ${sph}`);
    if (cyl !== null) parts.push(`CYL ${cyl}`);
    if (axis !== null) parts.push(`AXIS ${axis}`);
    if (add !== null) parts.push(`ADD ${add}`);
    return parts.join(" · ");
  };
  const right = eye("R", rx.right_sph, rx.right_cyl, rx.right_axis, rx.right_add);
  const left = eye("L", rx.left_sph, rx.left_cyl, rx.left_axis, rx.left_add);
  const parts = [right, left].filter(Boolean);
  if (rx.pd) parts.push(`PD ${rx.pd}`);
  if (rx.product_type) parts.unshift(rx.product_type);
  return parts.join(" · ");
}

function OrderLookupForm() {
  const navigate = useNavigate({ from: "/order-status" });
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = value.trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 60);
    if (!cleaned) {
      setError(true);
      return;
    }
    setError(false);
    navigate({ to: "/order-status", search: { orderId: cleaned } });
  }

  return (
    <section className="mx-auto max-w-md px-5 py-20 text-center">
      <Package className="mx-auto h-12 w-12 text-muted-foreground" strokeWidth={1.25} />
      <h1 className="mt-6 font-display text-3xl tracking-tight">Track your order</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Enter your order reference to see the latest status and delivery details.
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4 text-left">
        <div className="relative">
          <Input
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(false);
            }}
            placeholder="e.g. LMABC123"
            className="h-12 rounded-full pl-5 pr-12"
            autoComplete="off"
          />
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
        {error && <p className="text-xs text-red-600">Please enter a valid order reference.</p>}
        <Button type="submit" className="h-12 rounded-full w-full">
          Track order
        </Button>
      </form>
    </section>
  );
}
