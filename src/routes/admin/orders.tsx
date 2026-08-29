import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getAdminOrders, updateOrderStatus } from "@/lib/admin.functions";
import { getCsrfToken } from "@/lib/admin/client";
import {
  FULFILLMENT_STAGES,
  type AdminOrderItem,
  type AdminOrderRow,
  type AdminPrescription,
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
import { Check, CircleDot, Search, X } from "lucide-react";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrders,
});

const inr = (v: number) => `₹${Number(v).toLocaleString("en-IN")}`;
const dateTime = (v: string) =>
  new Date(v).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

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
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground">
            Fulfilment progress, items & prescriptions (Shopify).
          </p>
        </div>
        <div className="flex gap-6 text-right">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Shown</p>
            <p className="font-display text-lg">{filtered.length}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Paid value</p>
            <p className="font-display text-lg">{inr(revenue)}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value.slice(0, 80))}
            placeholder="Search order no, name, phone, city…"
            className="h-10 rounded-full pl-9"
          />
        </div>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-10 w-[150px] rounded-full">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {[...FULFILLMENT_STAGES, "cancelled"].map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={payment} onValueChange={setPayment}>
          <SelectTrigger className="h-10 w-[150px] rounded-full">
            <SelectValue placeholder="Payment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All payments</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>

        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="h-10 w-[140px] rounded-full">
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="1">Last 24 hours</SelectItem>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
          </SelectContent>
        </Select>

        {(activeFilters > 0 || query) && (
          <Button
            variant="ghost"
            className="h-10 rounded-full"
            onClick={() => {
              setQuery("");
              setStatus("all");
              setPayment("all");
              setRange("all");
            }}
          >
            <X className="mr-1 h-4 w-4" /> Clear
          </Button>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading orders…</p>
      ) : isError ? (
        <div className="rounded-xl border p-6 text-sm">
          <p className="text-muted-foreground">We couldn't load orders just now.</p>
          <Button variant="outline" size="sm" className="mt-3 rounded-full" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-xl border p-6 text-sm text-muted-foreground">
          {orders.length === 0 ? "No orders yet." : "No orders match these filters."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Order</th>
                <th className="px-4 py-3 text-left font-medium">Placed</th>
                <th className="px-4 py-3 text-left font-medium">Customer</th>
                <th className="px-4 py-3 text-left font-medium">Items</th>
                <th className="px-4 py-3 text-left font-medium">Total</th>
                <th className="px-4 py-3 text-left font-medium">Fulfilment</th>
                <th className="px-4 py-3 text-left font-medium">Payment</th>
                <th className="px-4 py-3 text-left font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((order) => {
                const rxCount = order.lineItems.filter((i) => i.prescription).length;
                return (
                  <tr key={order.id} className="align-top">
                    <td className="px-4 py-3 font-medium">{order.orderNumber}</td>
                    <td className="px-4 py-3 text-muted-foreground">{dateTime(order.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div>{order.customerName}</div>
                      <div className="text-xs text-muted-foreground">
                        {order.customerPhone} · {order.city}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {order.lineItems.reduce((n, i) => n + i.quantity, 0)}
                      {rxCount > 0 && (
                        <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                          {rxCount} Rx
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">{inr(order.total)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3">
                      <PaymentBadge status={order.paymentStatus} />
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" onClick={() => setOpenOrder(order)}>
                        View
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!openOrder} onOpenChange={(v) => !v && setOpenOrder(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          {openOrder && (
            <>
              <DialogHeader>
                <DialogTitle>Order {openOrder.orderNumber}</DialogTitle>
              </DialogHeader>
              <OrderDetail
                order={openOrder}
                onUpdate={() => {
                  setOpenOrder(null);
                  refetch();
                }}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OrderDetail({ order, onUpdate }: { order: AdminOrderRow; onUpdate: () => void }) {
  const update = useServerFn(updateOrderStatus);
  const [status, setStatus] = useState(order.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  async function save() {
    setSaving(true);
    setError(false);
    try {
      await update({
        data: { orderId: order.id, status, csrfToken: getCsrfToken() },
      });
      onUpdate();
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <Timeline
        status={order.status}
        createdAt={order.createdAt}
        updatedAt={order.updatedAt}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Customer</p>
          <p className="font-medium">{order.customerName}</p>
          <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
          {order.customerEmail && (
            <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
          )}
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Address</p>
          <p className="text-sm">
            {order.address1}
            {order.address2 ? `, ${order.address2}` : ""}
            <br />
            {order.city}, {order.state} — {order.pincode}
          </p>
        </div>
      </div>

      <div className="rounded-lg border p-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Payment</span>
          <PaymentBadge status={order.paymentStatus} />
        </div>
        <dl className="mt-2 grid gap-1 text-muted-foreground">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{inr(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Delivery</dt>
            <dd>{inr(order.deliveryFee)}</dd>
          </div>
          <div className="flex justify-between font-medium text-foreground">
            <dt>Total</dt>
            <dd>{inr(order.total)}</dd>
          </div>
        </dl>
        {order.note && (
          <p className="mt-2 break-all text-xs text-muted-foreground">{order.note}</p>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Items</p>
        <ul className="space-y-3">
          {order.lineItems.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
        </ul>
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Order status</label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[...FULFILLMENT_STAGES, "cancelled"].map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <p className="text-sm text-destructive">We couldn't save that. Please try again.</p>
      )}

      <Button onClick={save} disabled={saving} className="w-full rounded-full">
        {saving ? "Saving…" : "Update order"}
      </Button>
    </div>
  );
}

function ItemRow({ item }: { item: AdminOrderItem }) {
  return (
    <li className="rounded-lg border p-3 text-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">{item.title}</p>
          <p className="text-xs text-muted-foreground">
            {item.variantTitle || "Standard"}
          </p>
        </div>
        <span className="whitespace-nowrap text-muted-foreground">
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
    <div className="mt-3 rounded-md bg-muted/40 p-3">
      <p className="text-xs font-medium capitalize">Prescription · {rx.product_type}</p>
      <table className="mt-2 w-full text-xs">
        <thead className="text-muted-foreground">
          <tr>
            <th className="py-1 text-left font-medium">Eye</th>
            <th className="py-1 text-left font-medium">SPH</th>
            <th className="py-1 text-left font-medium">CYL</th>
            <th className="py-1 text-left font-medium">AXIS</th>
            <th className="py-1 text-left font-medium">ADD</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="py-1">Right (OD)</td>
            <td>{fmt(rx.right_sph)}</td>
            <td>{fmt(rx.right_cyl)}</td>
            <td>{fmt(rx.right_axis)}</td>
            <td>{fmt(rx.right_add)}</td>
          </tr>
          <tr>
            <td className="py-1">Left (OS)</td>
            <td>{fmt(rx.left_sph)}</td>
            <td>{fmt(rx.left_cyl)}</td>
            <td>{fmt(rx.left_axis)}</td>
            <td>{fmt(rx.left_add)}</td>
          </tr>
        </tbody>
      </table>
      <p className="mt-2 text-xs text-muted-foreground">
        PD: {rx.pd_type === "dual" ? `${fmt(rx.right_pd)} / ${fmt(rx.left_pd)}` : fmt(rx.pd)}
      </p>
      {rx.notes && <p className="mt-1 text-xs text-muted-foreground">Notes: {rx.notes}</p>}
      {rx.photo_url && safeHref(rx.photo_url) && (
        <a
          href={safeHref(rx.photo_url)!}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-block text-xs underline"
        >
          View prescription photo
        </a>
      )}
    </div>
  );
}

/** Only allow http(s) prescription photo links — blocks javascript:/data: URLs. */
function safeHref(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.href : null;
  } catch {
    return null;
  }
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
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
        Cancelled on {dateTime(updatedAt)}
      </div>
    );
  }
  const current = FULFILLMENT_STAGES.indexOf(status as (typeof FULFILLMENT_STAGES)[number]);
  return (
    <ol className="flex flex-wrap gap-3 rounded-lg border p-3">
      {FULFILLMENT_STAGES.map((stage, index) => {
        const done = current >= 0 && index <= current;
        const isCurrent = index === current;
        return (
          <li key={stage} className="flex min-w-[110px] flex-1 items-start gap-2">
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                done
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground/30 text-muted-foreground"
              }`}
            >
              {isCurrent ? <CircleDot className="h-3 w-3" /> : done ? <Check className="h-3 w-3" /> : null}
            </span>
            <div>
              <p className={`text-xs capitalize ${done ? "font-medium" : "text-muted-foreground"}`}>
                {stage}
              </p>
              {index === 0 && <p className="text-[11px] text-muted-foreground">{dateTime(createdAt)}</p>}
              {isCurrent && index > 0 && (
                <p className="text-[11px] text-muted-foreground">{dateTime(updatedAt)}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color =
    status === "delivered"
      ? "bg-emerald-100 text-emerald-700"
      : status === "shipped" || status === "processing" || status === "confirmed"
        ? "bg-sky-100 text-sky-700"
        : status === "pending"
          ? "bg-amber-100 text-amber-700"
          : status === "cancelled"
            ? "bg-rose-100 text-rose-700"
            : "bg-slate-100 text-slate-700";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${color}`}>
      {status}
    </span>
  );
}

function PaymentBadge({ status }: { status: string }) {
  const color =
    status === "paid"
      ? "bg-emerald-100 text-emerald-700"
      : status === "failed"
        ? "bg-rose-100 text-rose-700"
        : status === "refunded"
          ? "bg-slate-200 text-slate-700"
          : "bg-amber-100 text-amber-700";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${color}`}>
      {status}
    </span>
  );
}
