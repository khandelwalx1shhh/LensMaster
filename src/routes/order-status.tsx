import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Package,
  Truck,
  Search,
  Camera,
  Copy,
  Check,
  MessageCircle,
  Clock,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartStore } from "@/stores/cartStore";
import { getOrderByNumber, type OrderDetails } from "@/lib/orders.functions";
import { toast } from "sonner";

function cleanOrderId(v: unknown): string {
  return String(v ?? "")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 60);
}

function cleanString(v: unknown): string {
  return String(v ?? "").trim().slice(0, 100);
}

export const Route = createFileRoute("/order-status")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    orderId: cleanOrderId(search.orderId),
    status: cleanString(search.status),
    txnId: cleanString(search.txnId),
    amount: cleanString(search.amount),
  }),
  head: () => ({
    meta: [
      { title: "Order Status & Receipt — Lens Master" },
      {
        name: "description",
        content: "Your Lens Master payment receipt and order status confirmation.",
      },
      { property: "og:title", content: "Order Status — Lens Master" },
      {
        property: "og:description",
        content: "Your Lens Master payment receipt and order confirmation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: OrderStatusPage,
});

function OrderStatusPage() {
  const { orderId, status, txnId, amount } = Route.useSearch();
  const [phone, setPhone] = useState("");
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const [copiedTxn, setCopiedTxn] = useState(false);
  const [copiedOrder, setCopiedOrder] = useState(false);

  const clearCart = useCartStore((s) => s.clearCart);

  const isTxnSuccess = status === "TXN_SUCCESS";
  const isTxnFailed = status === "INVALID" || status === "FAILED";

  const {
    data: order,
    isPending,
    isError,
    refetch,
    isFetching,
  } = useQuery<OrderDetails | null>({
    queryKey: ["order-status", orderId || "lookup", verifiedPhone],
    queryFn: async () => {
      if (!orderId) return null;
      try {
        return await getOrderByNumber({
          data: { orderNumber: orderId, phone: verifiedPhone || undefined },
        });
      } catch {
        return null;
      }
    },
    enabled: !!orderId,
    staleTime: 15_000,
    refetchInterval: (query) => {
      // Poll every 5s if order is still settling or not yet paid
      if (!query.state.data || query.state.data.payment_status === "pending") {
        return 5000;
      }
      return false;
    },
  });

  const paid = isTxnSuccess || order?.payment_status === "paid";

  // Automatically empty the bag when payment succeeds
  useEffect(() => {
    if (paid) {
      clearCart();
    }
  }, [paid, clearCart]);

  const copyToClipboard = async (text: string, type: "txn" | "order") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "txn") {
        setCopiedTxn(true);
        setTimeout(() => setCopiedTxn(false), 2000);
      } else {
        setCopiedOrder(true);
        setTimeout(() => setCopiedOrder(false), 2000);
      }
      toast.success("Copied to clipboard!");
    } catch {
      toast.info(`Copied: ${text}`);
    }
  };

  if (!orderId && !txnId) {
    return <OrderLookupForm />;
  }

  const success = paid;
  const isFailed = isTxnFailed || order?.payment_status === "failed";
  const Icon = success ? CheckCircle2 : isFailed ? XCircle : AlertTriangle;

  const displayAmount = amount || (order ? String(order.total) : "");
  const displayTxnId = txnId || order?.id || "";

  const whatsappMessage = encodeURIComponent(
    `Hi Lens Master Team,\nI have completed my payment.\n\n📋 Order Reference: ${orderId}\n💳 Transaction ID: ${displayTxnId || "N/A"}\n💰 Amount: ₹${displayAmount || "N/A"}\n\nPlease confirm my order details.`,
  );

  return (
    <section className="mx-auto max-w-2xl px-5 py-10 sm:py-16">
      {/* Header Status Icon and Title */}
      <div className="text-center">
        <div className="inline-flex p-3 rounded-full bg-surface mb-2">
          <Icon
            className={`h-12 w-12 ${
              success
                ? "text-emerald-500"
                : isFailed
                  ? "text-rose-500"
                  : "text-amber-500"
            }`}
            strokeWidth={1.5}
          />
        </div>
        <h1 className="mt-3 font-display text-3xl sm:text-4xl tracking-tight">
          {success
            ? "Payment Successful!"
            : isFailed
              ? "Payment Incomplete"
              : "Payment Verification in Progress"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground max-w-md mx-auto">
          {success
            ? "Thank you! Your payment has been confirmed. The Lens Master team is preparing your order."
            : isFailed
              ? "Your payment was not completed. No amount was deducted. You can retry anytime."
              : "We are receiving your payment confirmation. If money was debited, it will update automatically."}
        </p>
      </div>

      {/* Automated WhatsApp Confirmation Banner */}
      {success && (
        <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-emerald-950 dark:text-emerald-200">
          <div className="flex items-start gap-3.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
              <MessageCircle className="h-5 w-5" strokeWidth={2} />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-sm sm:text-base flex items-center gap-1.5">
                💬 Automated WhatsApp Confirmation Sent!
              </p>
              <p className="text-xs sm:text-sm text-emerald-900/80 dark:text-emerald-200/80 leading-relaxed">
                We've sent an automated order confirmation to your WhatsApp number
                {order?.customer_phone ? <strong> ({order.customer_phone})</strong> : ""}. The Lens Master team is reviewing your order.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Prominent Screenshot Notice Banner */}
      {success && (
        <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-950 dark:text-amber-200">
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
              <Camera className="h-4 w-4" strokeWidth={2} />
            </div>
            <p className="text-xs text-amber-900/80 dark:text-amber-200/80 leading-relaxed">
              <strong>Tip:</strong> Keep a screenshot of this receipt with Order Reference <strong>{orderId || "N/A"}</strong> for fast in-store or online support.
            </p>
          </div>
        </div>
      )}

      {/* Order & Payment Receipt Card */}
      <div className="mt-6 rounded-2xl border bg-card overflow-hidden shadow-sm">
        <div className="p-5 border-b bg-surface/40 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Order Reference
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="font-mono font-semibold text-lg">{orderId || "Pending"}</p>
              {orderId && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(orderId, "order")}
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                  title="Copy Order ID"
                >
                  {copiedOrder ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-[11px] uppercase font-medium tracking-wider px-3 py-1 rounded-full ${
                success
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  : isFailed
                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
              }`}
            >
              {success ? "PAID" : isFailed ? "FAILED" : "PROCESSING"}
            </span>
          </div>
        </div>

        {/* Transaction Meta Details */}
        <div className="p-5 space-y-3.5 text-sm">
          {displayTxnId && (
            <div className="flex items-center justify-between gap-2 py-1 border-b border-border/60">
              <span className="text-muted-foreground text-xs uppercase tracking-wider">
                Payment / Txn ID
              </span>
              <div className="flex items-center gap-1.5 font-mono text-xs">
                <span>{displayTxnId}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(displayTxnId, "txn")}
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                  title="Copy Transaction ID"
                >
                  {copiedTxn ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              </div>
            </div>
          )}

          {displayAmount && (
            <div className="flex items-center justify-between py-1 border-b border-border/60">
              <span className="text-muted-foreground text-xs uppercase tracking-wider">
                Total Amount Paid
              </span>
              <span className="font-display font-semibold text-lg">₹{displayAmount}</span>
            </div>
          )}

          <div className="flex items-center justify-between py-1">
            <span className="text-muted-foreground text-xs uppercase tracking-wider">
              Payment Gateway
            </span>
            <span className="font-medium text-xs">Razorpay Secure Checkout</span>
          </div>
        </div>

        {/* Processing Delay Notice */}
        <div className="px-5 py-3.5 bg-muted/40 border-t flex items-start gap-2.5 text-xs text-muted-foreground">
          <Clock className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
          <p className="leading-relaxed">
            <strong>Note:</strong> It may take <strong>1 to 2 minutes</strong> for the order
            inventory and tracking status to fully update across the website.
          </p>
        </div>

        {/* Full Order Items (if loaded from DB) */}
        {order && order.items && order.items.length > 0 && (
          <div className="p-5 border-t space-y-4">
            <h2 className="font-medium text-sm uppercase tracking-wider text-muted-foreground">
              Order Items
            </h2>
            <ul className="space-y-3">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-4 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{item.title}</p>
                    {item.variant_title && (
                      <p className="text-xs text-muted-foreground truncate">
                        {item.variant_title}
                      </p>
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
          </div>
        )}

        {/* Delivery Address (if available) */}
        {order && !order.redacted && order.customer_name && (
          <div className="p-5 border-t bg-surface/30 text-sm space-y-1.5">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Delivery Address
            </p>
            <p className="font-medium">{order.customer_name}</p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              {order.address_line1}
              {order.address_line2 ? `, ${order.address_line2}` : ""}
              <br />
              {order.city}, {order.state} — {order.pincode}
            </p>
            {order.customer_phone && (
              <p className="text-muted-foreground text-xs pt-1">
                📞 {order.customer_phone}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
        <Button asChild className="h-12 rounded-full px-8 w-full sm:w-auto font-medium">
          <Link to="/shop">{success ? "Continue Shopping" : "Back to Collection"}</Link>
        </Button>

        {/* Direct WhatsApp Assistance Button */}
        <Button
          asChild
          variant="outline"
          className="h-12 rounded-full px-6 w-full sm:w-auto border-emerald-600/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
        >
          <a
            href={`https://wa.me/919829230548?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2"
          >
            <MessageCircle className="h-4 w-4 fill-current" />
            <span>Chat on WhatsApp</span>
          </a>
        </Button>

        {/* Refresh Status Button */}
        {orderId && (
          <Button
            variant="ghost"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-12 rounded-full px-4 text-xs text-muted-foreground"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh Status
          </Button>
        )}
      </div>

      {/* Support & Guarantee Badges */}
      <div className="mt-10 grid sm:grid-cols-2 gap-4 text-sm">
        <div className="rounded-2xl border p-5 flex items-start gap-3 bg-card/50">
          <Package className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" strokeWidth={1.5} />
          <div>
            <p className="font-medium text-sm">Order Verification</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Our optical team will verify power parameters and frame fitting before dispatch.
            </p>
          </div>
        </div>
        <div className="rounded-2xl border p-5 flex items-start gap-3 bg-card/50">
          <Truck className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" strokeWidth={1.5} />
          <div>
            <p className="font-medium text-sm">Express Shipping</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Secure packaging with pan-India express delivery within 4–7 working days.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function formatRx(rx: NonNullable<OrderDetails["items"][number]["prescription"]>) {
  const eye = (
    label: string,
    sph: number | null,
    cyl: number | null,
    axis: number | null,
    add: number | null,
  ) => {
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
    const cleaned = value
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, "")
      .slice(0, 60);
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
      <h1 className="mt-6 font-display text-3xl tracking-tight">Track Your Order</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Enter your order reference to see the latest status and delivery updates.
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
          Track Order
        </Button>
      </form>
    </section>
  );
}
