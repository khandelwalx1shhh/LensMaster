import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getAdminOrders, updateOrderStatus } from "@/lib/admin.functions";
import { getCsrfToken } from "@/lib/admin/client";
import {
  FULFILLMENT_STAGES,
  type AdminOrderItem,
  type AdminOrderRow,
  type AdminPrescription,
  type FulfillmentStage,
} from "@/lib/admin-orders.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Check,
  CircleDot,
  Search,
  X,
  Printer,
  MessageCircle,
  Glasses,
  ExternalLink,
} from "lucide-react";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrders,
});

const inr = (v: number) => `₹${Number(v || 0).toLocaleString("en-IN")}`;
const dateTime = (v: string) =>
  new Date(v).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const STAGE_LABELS: Record<string, string> = {
  pending: "Pending",
  processing: "Under Process (Lab)",
  ready: "Ready for Dispatch",
  shipped: "Shipped / In Transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
  confirmed: "Confirmed",
};

function AdminOrders() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: () => getAdminOrders(),
  });

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [payment, setPayment] = useState("all");
  const [range, setRange] = useState("all");
  const [openOrder, setOpenOrder] = useState<AdminOrderRow | null>(null);
  const [labelOrder, setLabelOrder] = useState<AdminOrderRow | null>(null);

  const orders = useMemo(() => (data ?? []) as AdminOrderRow[], [data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const cutoff =
      range === "all" ? 0 : Date.now() - Number(range) * 24 * 60 * 60 * 1000;

    return orders.filter((o) => {
      if (status !== "all" && o.status !== status) return false;
      if (payment !== "all" && o.paymentStatus !== payment) return false;
      if (cutoff && new Date(o.createdAt).getTime() < cutoff) return false;
      if (!q) return true;
      const haystack = [
        o.orderNumber,
        o.customerName,
        o.customerPhone ?? "",
        o.customerEmail ?? "",
        o.city,
        o.state,
        o.pincode,
        o.note ?? "",
        ...o.lineItems.map((i) => i.title),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [orders, query, status, payment, range]);

  const revenue = filtered
    .filter((o) => o.paymentStatus === "paid")
    .reduce((sum, o) => sum + o.total, 0);

  const activeFilters =
    (status !== "all" ? 1 : 0) +
    (payment !== "all" ? 1 : 0) +
    (range !== "all" ? 1 : 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">Order Management</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Track optical lab processing, ready parcels, shipping labels & customer notifications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-border/80 bg-card px-4 py-2 text-right shadow-xs">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Filtered Revenue</span>
            <p className="font-display text-lg font-bold text-emerald-600 dark:text-emerald-400 leading-tight">{inr(revenue)}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 bg-card p-4 rounded-2xl border border-border/70 shadow-xs">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search order #, customer, phone, city..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9.5 rounded-xl text-xs bg-background h-10"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="rounded-xl text-xs bg-background h-10">
            <SelectValue placeholder="Fulfillment Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Under Process (Lab)</SelectItem>
            <SelectItem value="ready">Ready for Dispatch</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select value={payment} onValueChange={setPayment}>
          <SelectTrigger className="rounded-xl text-xs bg-background h-10">
            <SelectValue placeholder="Payment Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            <SelectItem value="paid">Paid (Razorpay)</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="rounded-xl text-xs bg-background h-10">
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="1">Last 24 Hours</SelectItem>
            <SelectItem value="7">Last 7 Days</SelectItem>
            <SelectItem value="30">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-sm text-muted-foreground animate-pulse">
          Loading optical orders…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center bg-card/40">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Search className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <h3 className="mt-4 font-display text-base font-semibold text-foreground">No matching orders found</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {activeFilters > 0 ? "Try clearing some of your filters to see more results." : "When customers place orders, they will appear here."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border/60">
                <tr>
                  <th className="px-4 py-3.5">Order</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5">Customer & Delivery</th>
                  <th className="px-4 py-3.5">Items</th>
                  <th className="px-4 py-3.5">Total</th>
                  <th className="px-4 py-3.5">Fulfillment Stage</th>
                  <th className="px-4 py-3.5">Payment</th>
                  <th className="px-4 py-3.5 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((order) => {
                  const rxCount = order.lineItems.filter((i) => i.prescription).length;
                  const isReadyOrShipped = order.status === "ready" || order.status === "shipped" || order.status === "processing";
                  return (
                    <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3.5 font-mono font-semibold text-foreground">
                        {order.orderNumber}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">
                        {dateTime(order.createdAt)}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-foreground">{order.customerName}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          📞 {order.customerPhone || "N/A"} · {order.city}, {order.state}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-medium text-foreground">
                          {order.lineItems.reduce((n, i) => n + i.quantity, 0)} items
                        </span>
                        {rxCount > 0 && (
                          <span className="ml-2 inline-flex items-center gap-1 rounded-md bg-purple-500/10 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 text-[10px] font-semibold border border-purple-500/20">
                            <Glasses className="h-3 w-3" /> {rxCount} Rx
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-foreground">
                        {inr(order.total)}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-3.5">
                        <PaymentBadge status={order.paymentStatus} />
                      </td>
                      <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                        {isReadyOrShipped && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setLabelOrder(order)}
                            className="h-8 rounded-lg px-2.5 text-xs border-primary/30 text-primary hover:bg-primary/10"
                            title="Print Shipping Label"
                          >
                            <Printer className="h-3.5 w-3.5 mr-1" />
                            <span>Label</span>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setOpenOrder(order)}
                          className="h-8 rounded-lg px-3 text-xs font-semibold"
                        >
                          Manage
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={!!openOrder} onOpenChange={(v) => !v && setOpenOrder(null)}>
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto rounded-3xl p-6">
          {openOrder && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-border/60">
                  <div>
                    <DialogTitle className="font-display text-xl font-bold">Order {openOrder.orderNumber}</DialogTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">Placed on {dateTime(openOrder.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLabelOrder(openOrder)}
                      className="rounded-xl h-9 text-xs border-primary/40 text-primary hover:bg-primary/10"
                    >
                      <Printer className="h-3.5 w-3.5 mr-1.5" />
                      Print Shipping Label
                    </Button>
                  </div>
                </div>
              </DialogHeader>
              <OrderDetail
                order={openOrder}
                onPrintLabel={() => setLabelOrder(openOrder)}
                onUpdate={() => {
                  setOpenOrder(null);
                  refetch();
                }}
              />
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!labelOrder} onOpenChange={(v) => !v && setLabelOrder(null)}>
        <DialogContent className="max-h-[95vh] max-w-2xl overflow-y-auto rounded-3xl p-6 sm:p-8">
          {labelOrder && (
            <ShippingLabelModal
              order={labelOrder}
              onClose={() => setLabelOrder(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OrderDetail({
  order,
  onUpdate,
}: {
  order: AdminOrderRow;
  onUpdate: () => void;
  onPrintLabel: () => void;
}) {
  const update = useServerFn(updateOrderStatus);
  const [status, setStatus] = useState(order.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  async function handleStatusChange(newStatus: string) {
    setStatus(newStatus);
    setSaving(true);
    setError(false);
    try {
      await update({
        data: { orderId: order.id, status: newStatus, csrfToken: getCsrfToken() },
      });
      onUpdate();
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  const customerPhoneClean = (order.customerPhone || "").replace(/\D/g, "");
  const whatsappUrl = `https://wa.me/${customerPhoneClean.length === 10 ? `91${customerPhoneClean}` : customerPhoneClean}?text=${encodeURIComponent(
    `Hi ${order.customerName},\nRegarding your Lens Master Order #${order.orderNumber}:\nStatus: ${STAGE_LABELS[status] || status}\n\nOur Jaipur optical team is at your service. Please let us know if you need any assistance!`
  )}`;

  return (
    <div className="space-y-6 pt-2 text-xs">
      <Timeline
        status={order.status}
        createdAt={order.createdAt}
        updatedAt={order.updatedAt}
      />

      <div className="rounded-2xl border border-border/80 bg-muted/40 p-4 space-y-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Update Fulfillment Stage
        </span>
        <div className="flex flex-wrap gap-2">
          {FULFILLMENT_STAGES.map((stage) => {
            const isCurrent = order.status === stage;
            return (
              <Button
                key={stage}
                size="sm"
                variant={isCurrent ? "default" : "outline"}
                disabled={saving}
                onClick={() => handleStatusChange(stage)}
                className={`rounded-xl text-xs h-8.5 font-medium transition-all ${
                  isCurrent ? "shadow-xs font-semibold" : "bg-card hover:bg-muted"
                }`}
              >
                {STAGE_LABELS[stage] || stage}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-1.5 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Customer</p>
          <p className="font-bold text-sm text-foreground">{order.customerName}</p>
          <div className="space-y-1 text-muted-foreground pt-1">
            <p className="flex items-center gap-1.5 font-medium text-foreground">
              📞 {order.customerPhone || "Not provided"}
            </p>
            {order.customerEmail && <p>✉️ {order.customerEmail}</p>}
          </div>

          {order.customerPhone && (
            <div className="pt-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px] transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Message Customer on WhatsApp</span>
              </a>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-1.5 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Delivery Destination</p>
          <p className="text-foreground leading-relaxed font-medium pt-1">
            {order.address1}
            {order.address2 ? `, ${order.address2}` : ""}
            <br />
            {order.city}, {order.state} — <strong className="text-foreground font-semibold">{order.pincode}</strong>
            <br />
            <span className="text-[11px] text-muted-foreground">India</span>
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Payment Summary</span>
          <PaymentBadge status={order.paymentStatus} />
        </div>
        <dl className="mt-3 grid gap-1.5 text-muted-foreground">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd className="text-foreground font-medium">{inr(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Delivery Fee</dt>
            <dd className="text-foreground font-medium">{inr(order.deliveryFee)}</dd>
          </div>
          <div className="flex justify-between font-bold text-foreground text-sm pt-2 border-t border-border/50">
            <dt>Total Amount</dt>
            <dd className="text-emerald-600 dark:text-emerald-400">{inr(order.total)}</dd>
          </div>
        </dl>
        {order.note && (
          <p className="mt-3 p-2.5 rounded-xl bg-muted/50 text-[11px] text-muted-foreground border border-border/40">
            <strong>Notes:</strong> {order.note}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <p className="font-semibold text-foreground text-sm">Ordered Eyewear & Lenses</p>
        <ul className="space-y-3">
          {order.lineItems.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
        </ul>
      </div>

      {error && (
        <p className="text-xs font-semibold text-destructive">
          Failed to update order status. Please try again.
        </p>
      )}
    </div>
  );
}

function ItemRow({ item }: { item: AdminOrderItem }) {
  return (
    <li className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="font-bold text-sm text-foreground">{item.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {item.variantTitle ? `Variant: ${item.variantTitle}` : "Standard Specification"}
          </p>
        </div>
        <span className="font-semibold text-foreground text-sm">
          {item.quantity} × {inr(item.price)}
        </span>
      </div>
      {item.prescription && <PrescriptionTable rx={item.prescription} />}
    </li>
  );
}

function PrescriptionTable({ rx }: { rx: AdminPrescription }) {
  const fmt = (v: number | null) => (v === null || v === undefined ? "—" : String(v));
  return (
    <div className="mt-3 rounded-xl bg-muted/40 p-3.5 border border-border/50">
      <p className="text-xs font-bold text-foreground capitalize">Prescription Parameters · {rx.product_type}</p>
      <div className="overflow-x-auto mt-2">
        <table className="w-full text-xs">
          <thead className="text-muted-foreground font-semibold">
            <tr>
              <th className="py-1 text-left">Eye</th>
              <th className="py-1 text-left">SPH</th>
              <th className="py-1 text-left">CYL</th>
              <th className="py-1 text-left">AXIS</th>
              <th className="py-1 text-left">ADD</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 font-mono">
            <tr>
              <td className="py-1 font-sans font-medium text-foreground">Right (OD)</td>
              <td>{fmt(rx.right_sph)}</td>
              <td>{fmt(rx.right_cyl)}</td>
              <td>{fmt(rx.right_axis)}</td>
              <td>{fmt(rx.right_add)}</td>
            </tr>
            <tr>
              <td className="py-1 font-sans font-medium text-foreground">Left (OS)</td>
              <td>{fmt(rx.left_sph)}</td>
              <td>{fmt(rx.left_cyl)}</td>
              <td>{fmt(rx.left_axis)}</td>
              <td>{fmt(rx.left_add)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-2.5 text-xs text-muted-foreground">
        <strong>Pupillary Distance (PD):</strong> {rx.pd_type === "dual" ? `${fmt(rx.right_pd)} / ${fmt(rx.left_pd)} mm` : `${fmt(rx.pd)} mm`}
      </p>
      {rx.notes && <p className="mt-1 text-xs text-muted-foreground"><strong>Optician Notes:</strong> {rx.notes}</p>}
      {rx.photo_url && (
        <a
          href={rx.photo_url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary underline"
        >
          <span>View Prescription Photo</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
}

function Timeline({
  status,
  createdAt,
  updatedAt,
}: {
  status: string;
  createdAt: string;
  updatedAt: string;
}) {
  if (status === "cancelled") {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-semibold text-rose-800 dark:text-rose-300">
        ❌ Order Cancelled on {dateTime(updatedAt)}
      </div>
    );
  }

  const current = FULFILLMENT_STAGES.indexOf(status as FulfillmentStage);

  return (
    <ol className="grid grid-cols-2 sm:grid-cols-5 gap-2 rounded-2xl border border-border/80 bg-card p-3 shadow-xs">
      {FULFILLMENT_STAGES.map((stage, index) => {
        const done = current >= 0 && index <= current;
        const isCurrent = index === current;
        return (
          <li
            key={stage}
            className={`p-2.5 rounded-xl border transition-colors ${
              isCurrent
                ? "bg-primary/10 border-primary/40 text-primary"
                : done
                  ? "bg-muted/60 border-border/60 text-foreground"
                  : "bg-muted/20 border-transparent text-muted-foreground opacity-60"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] ${
                  done ? "bg-primary text-primary-foreground font-bold" : "border border-muted-foreground"
                }`}
              >
                {done ? "✓" : index + 1}
              </span>
              <p className="text-[11px] font-bold capitalize truncate">
                {STAGE_LABELS[stage] || stage}
              </p>
            </div>
            {isCurrent && (
              <p className="text-[10px] text-muted-foreground mt-1 truncate">
                Active Stage
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function ShippingLabelModal({
  order,
  onClose,
}: {
  order: AdminOrderRow;
  onClose: () => void;
}) {
  const printRef = useRef<HTMLDivElement>(null);
  function handlePrint() { window.print(); }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-3 no-print">
        <div>
          <h2 className="font-display text-lg font-bold">Shipping Label & Packing Slip</h2>
          <p className="text-xs text-muted-foreground">Order Reference #{order.orderNumber}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handlePrint} className="rounded-xl px-5 font-bold shadow-xs">
            <Printer className="h-4 w-4 mr-2" />
            Print Label (4x6 / A5)
          </Button>
        </div>
      </div>

      <div
        ref={printRef}
        id="shipping-label-printable"
        className="rounded-2xl border-2 border-dashed border-zinc-950/80 bg-white text-zinc-950 p-6 sm:p-8 font-sans shadow-sm print:border-solid print:p-4 print:shadow-none"
      >
        <div className="flex items-start justify-between border-b-2 border-zinc-950 pb-4">
          <div>
            <span className="font-display text-2xl font-black tracking-tight uppercase">Lens Master</span>
            <p className="text-[11px] font-semibold text-zinc-600 uppercase tracking-widest mt-0.5">by The Swadesh • Jaipur Optical Showroom</p>
          </div>
          <div className="text-right">
            <span className="inline-block border-2 border-zinc-950 px-2.5 py-1 text-xs font-black uppercase tracking-wider rounded-md">PREPAID</span>
            <p className="text-[11px] font-mono font-bold mt-1">Ref: #{order.orderNumber}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 py-4 border-b-2 border-zinc-950 text-xs">
          <div className="pr-3 border-r-2 border-zinc-950/40 space-y-1">
            <span className="font-bold uppercase tracking-wider text-[10px] text-zinc-500">FROM (DISPATCH LAB):</span>
            <p className="font-bold text-sm text-zinc-950 leading-tight">LENS MASTER SHOWROOM</p>
            <p className="text-zinc-700 leading-relaxed text-[11px]">B-51, Lal Kothi Shopping Centre, Laxmi Colony,<br />Lalkothi, Jaipur, Rajasthan — <strong>302015</strong></p>
            <p className="font-semibold text-zinc-800 text-[11px] pt-1">📞 +91 98292 30548 • 0141-4112904</p>
          </div>
          <div className="pl-1 space-y-1">
            <span className="font-bold uppercase tracking-wider text-[10px] text-zinc-500">DELIVER TO:</span>
            <p className="font-black text-sm text-zinc-950 leading-tight">{order.customerName.toUpperCase()}</p>
            <p className="font-bold text-zinc-900 text-xs">📞 {order.customerPhone || "N/A"}</p>
            <p className="text-zinc-800 leading-relaxed text-[11px] pt-0.5">{order.address1}{order.address2 ? `, ${order.address2}` : ""}<br /><strong>{order.city.toUpperCase()}, {order.state.toUpperCase()}</strong><br />PINCODE: <strong className="text-sm font-black tracking-wider">{order.pincode}</strong></p>
          </div>
        </div>

        <div className="py-4 border-b-2 border-zinc-950 text-xs space-y-2">
          <span className="font-bold uppercase tracking-wider text-[10px] text-zinc-500">PARCEL CONTENTS & OPTICAL SPECIFICATION:</span>
          <div className="space-y-1.5">
            {order.lineItems.map((item, idx) => (
              <div key={item.id} className="flex justify-between items-start text-xs">
                <div>
                  <span className="font-bold text-zinc-950">{idx + 1}. {item.title}</span>
                  {item.variantTitle && <span className="text-zinc-600 block text-[11px]">↳ Variant: {item.variantTitle}</span>}
                </div>
                <span className="font-mono font-bold text-zinc-900">Qty: {item.quantity}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 flex items-center justify-between text-xs">
          <div className="space-y-1">
            <div className="font-mono tracking-widest text-lg font-black uppercase">*LM-{order.orderNumber.replace(/\D/g, "") || "000"}*</div>
            <p className="text-[10px] font-bold text-zinc-600 uppercase">⚠️ FRAGILE: OPTICAL GLASSES • HANDLE WITH CARE</p>
          </div>
          <div className="text-right text-[11px]">
            <p className="font-bold text-zinc-950">Package: 1 of 1</p>
            <p className="text-zinc-600 text-[10px]">{new Date().toLocaleDateString("en-IN")}</p>
          </div>
        </div>
      </div>
      <style>{`@media print { body * { visibility: hidden !important; } #shipping-label-printable, #shipping-label-printable * { visibility: visible !important; } #shipping-label-printable { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; max-width: 100% !important; border: 2px solid #000 !important; padding: 24px !important; box-shadow: none !important; background: white !important; color: black !important; } .no-print { display: none !important; } }`}</style>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color = status === "delivered" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" : status === "ready" ? "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20" : status === "shipped" ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20" : status === "processing" ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" : status === "cancelled" ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20" : "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20";
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize border ${color}`}>{STAGE_LABELS[status] || status}</span>;
}

function PaymentBadge({ status }: { status: string }) {
  const color = status === "paid" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" : status === "failed" ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20" : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize border ${color}`}>{status === "paid" ? "PAID" : status}</span>;
}
