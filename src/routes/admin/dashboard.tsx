import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getAdminStats } from "@/lib/admin.functions";
import { Package, ShoppingBag, Users, IndianRupee } from "lucide-react";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboard,
});

const inr = (v: number) => `₹${Number(v).toLocaleString("en-IN")}`;

function AdminDashboard() {
  const { data } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => getAdminStats(),
  });

  const stats = data ?? {
    productCount: 0,
    orderCount: 0,
    customerCount: 0,
    revenue: 0,
    recentOrders: [],
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your store.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Package} label="Products" value={stats.productCount} />
        <StatCard icon={ShoppingBag} label="Orders" value={stats.orderCount} />
        <StatCard icon={Users} label="Customers" value={stats.customerCount} />
        <StatCard icon={IndianRupee} label="Revenue" value={inr(stats.revenue)} />
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg tracking-tight">Recent orders</h2>
        {stats.recentOrders.length === 0 ? (
          <p className="rounded-xl border p-6 text-sm text-muted-foreground">
            No orders yet.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Order</th>
                  <th className="px-4 py-3 text-left font-medium">Customer</th>
                  <th className="px-4 py-3 text-left font-medium">Total</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {stats.recentOrders.map((order: any) => (
                  <tr key={order.id}>
                    <td className="px-4 py-3">
                      <Link to="/admin/orders" className="font-medium hover:underline">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {order.customerName}
                    </td>
                    <td className="px-4 py-3">{inr(order.total)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="font-display text-2xl tracking-tight">{value}</p>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color =
    status === "confirmed" || status === "delivered"
      ? "bg-emerald-100 text-emerald-700"
      : status === "pending"
        ? "bg-amber-100 text-amber-700"
        : "bg-slate-100 text-slate-700";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${color}`}
    >
      {status}
    </span>
  );
}
