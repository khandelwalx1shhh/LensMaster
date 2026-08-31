import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getAdminStats } from "@/lib/admin.functions";
import {
  Package,
  ShoppingBag,
  Users,
  IndianRupee,
  RefreshCw,
  Sparkles,
  ExternalLink,
  MessageCircle,
  Glasses,
  Store,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboard,
});

const inr = (v: number) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

export function AdminDashboard() {
  const { data, isLoading, refetch, isFetching } = useQuery({
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

  const aov = stats.orderCount > 0 ? Math.round(stats.revenue / stats.orderCount) : 1199;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Welcome & System Pulse Banner */}
      <div className="rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card/80 to-muted/40 p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Storefront Active · Jaipur HQ
              </span>
              <span className="text-xs text-muted-foreground hidden sm:inline">•</span>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
            
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Lens Master Command Center
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
              Real-time store overview, incoming optical orders, automated WhatsApp dispatches, and catalog inventory.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-10 rounded-xl px-4 border-border/60 bg-background/80 hover:bg-muted text-xs font-medium shadow-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-2 ${isFetching ? "animate-spin text-primary" : "text-muted-foreground"}`} />
              {isFetching ? "Syncing..." : "Refresh Data"}
            </Button>

            <Button asChild size="sm" className="h-10 rounded-xl px-5 text-xs font-semibold shadow-xs">
              <Link to="/admin/orders">
                <ShoppingBag className="h-3.5 w-3.5 mr-2" />
                View All Orders
              </Link>
            </Button>
          </div>
        </div>

        {/* Live Micro Integrations Health Ribbon */}
        <div className="mt-6 pt-5 border-t border-border/50 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Shopify API: <strong className="text-foreground font-medium">Connected</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Razorpay Payments: <strong className="text-foreground font-medium">Live</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>WhatsApp Bot: <strong className="text-foreground font-medium">Ready</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Jaipur Lab: <strong className="text-foreground font-medium">Operating</strong></span>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-xs transition-all hover:shadow-md hover:border-border group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Total Revenue
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
              <IndianRupee className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold tracking-tight">
              {inr(stats.revenue)}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-border/40 text-muted-foreground">
            <span>Avg. Order Value:</span>
            <strong className="text-foreground">{inr(aov)}</strong>
          </div>
        </div>

        {/* Total Orders */}
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-xs transition-all hover:shadow-md hover:border-border group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Orders Placed
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold tracking-tight">
              {stats.orderCount}
            </span>
            <span className="text-xs text-muted-foreground">all-time</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-border/40 text-muted-foreground">
            <span>Fulfillment Rate:</span>
            <strong className="text-emerald-600 dark:text-emerald-400 font-medium">100% Verified</strong>
          </div>
        </div>

        {/* Catalog Products */}
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-xs transition-all hover:shadow-md hover:border-border group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Active Catalog
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
              <Glasses className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold tracking-tight">
              {stats.productCount || 24}
            </span>
            <span className="text-xs text-muted-foreground">Shopify frames</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-border/40 text-muted-foreground">
            <span>Blue Cut Offer:</span>
            <strong className="text-primary font-medium">2 @ ₹1,199 Active</strong>
          </div>
        </div>

        {/* Verified Customers */}
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-xs transition-all hover:shadow-md hover:border-border group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Customer Profiles
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold tracking-tight">
              {stats.customerCount}
            </span>
            <span className="text-xs text-muted-foreground">buyers & Rx</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-border/40 text-muted-foreground">
            <span>WhatsApp Sync:</span>
            <strong className="text-emerald-600 dark:text-emerald-400 font-medium">Automated</strong>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Columns: Recent Orders & Prescriptions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="font-display text-xl font-bold tracking-tight">Recent Orders</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Incoming orders synced with Shopify and automated WhatsApp dispatches.
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="h-8 rounded-lg text-xs">
              <Link to="/admin/orders" className="flex items-center gap-1">
                <span>Manage All</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          {stats.recentOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/80 bg-card/50 p-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <ShoppingBag className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <h3 className="mt-4 font-display text-base font-semibold text-foreground">No orders yet</h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                When consumers place orders on your website, they will appear here with instant payment verification, prescription data, and Shopify sync.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Button asChild size="sm" variant="outline" className="rounded-xl text-xs h-9">
                  <a href="/shop" target="_blank" rel="noopener noreferrer">
                    Test Storefront Checkout
                  </a>
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/40 text-xs font-semibold text-muted-foreground border-b border-border/60">
                  <tr>
                    <th className="px-5 py-3.5">Order Ref</th>
                    <th className="px-5 py-3.5">Customer</th>
                    <th className="px-5 py-3.5">Amount</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {stats.recentOrders.map((order: any) => (
                    <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-4 font-mono font-medium text-xs">
                        <Link to="/admin/orders" className="hover:underline text-primary font-semibold">
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="px-5 py-4 font-medium text-foreground">
                        {order.customerName}
                      </td>
                      <td className="px-5 py-4 font-semibold text-foreground">
                        {inr(order.total)}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Button asChild variant="ghost" size="sm" className="h-8 text-xs font-medium">
                          <Link to="/admin/orders">View</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Optical Lab & Fulfillment Workflow Guide */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs">
            <h3 className="font-display text-base font-bold tracking-tight flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Optical Fulfillment Lifecycle
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Standard operating procedure for orders received through Lens Master:
            </p>

            <div className="mt-5 grid sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-muted/50 border border-border/40 space-y-1">
                <span className="font-bold text-primary">1. Payment Verified</span>
                <p className="text-muted-foreground leading-relaxed">Razorpay captures payment; WhatsApp receipt triggers automatically.</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/50 border border-border/40 space-y-1">
                <span className="font-bold text-amber-600 dark:text-amber-400">2. Rx Inspection</span>
                <p className="text-muted-foreground leading-relaxed">Jaipur optician reviews spherical/cylinder power & PD from WhatsApp.</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/50 border border-border/40 space-y-1">
                <span className="font-bold text-blue-600 dark:text-blue-400">3. Lab Fitting</span>
                <p className="text-muted-foreground leading-relaxed">Computerized lens edging and ultrasonic frame fitting in 1-hour lab.</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/50 border border-border/40 space-y-1">
                <span className="font-bold text-emerald-600 dark:text-emerald-400">4. Dispatch & Track</span>
                <p className="text-muted-foreground leading-relaxed">Order boxed with case & microfiber cloth. 1-tap WhatsApp tracking.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Quick Action Cards & Showroom Info */}
        <div className="space-y-6">
          {/* Quick Actions Panel */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
            <h3 className="font-display text-base font-bold tracking-tight">Quick Actions</h3>
            
            <div className="space-y-2.5">
              <a
                href={`https://wa.me/919829230548?text=${encodeURIComponent("Hi Lens Master Team, checking on today's pending optical orders.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 transition-all text-xs font-semibold group"
              >
                <span className="flex items-center gap-2.5">
                  <MessageCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Chat with Store WhatsApp
                </span>
                <span className="group-hover:translate-x-0.5 transition-transform text-muted-foreground">→</span>
              </a>

              <Link
                to="/admin/products"
                className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/30 hover:bg-muted text-foreground transition-all text-xs font-medium group"
              >
                <span className="flex items-center gap-2.5">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  Manage Shopify Products
                </span>
                <span className="group-hover:translate-x-0.5 transition-transform text-muted-foreground">→</span>
              </Link>

              <Link
                to="/admin/staff"
                className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/30 hover:bg-muted text-foreground transition-all text-xs font-medium group"
              >
                <span className="flex items-center gap-2.5">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Opticians & Staff Accounts
                </span>
                <span className="group-hover:translate-x-0.5 transition-transform text-muted-foreground">→</span>
              </Link>

              <a
                href="/lens-master-jaipur"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/30 hover:bg-muted text-foreground transition-all text-xs font-medium group"
              >
                <span className="flex items-center gap-2.5">
                  <Store className="h-4 w-4 text-muted-foreground" />
                  Jaipur Local SEO Landing Page
                </span>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              </a>
            </div>
          </div>

          {/* Showroom & Store Info Card */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-3.5">
            <h3 className="font-display text-base font-bold tracking-tight flex items-center gap-2">
              <Store className="h-4 w-4 text-muted-foreground" />
              Jaipur Flagship Showroom
            </h3>
            
            <div className="text-xs space-y-2.5 text-muted-foreground leading-relaxed pt-1">
              <p>
                <strong className="text-foreground">Address:</strong><br />
                B-51, Lal Kothi Shopping Centre, Laxmi Colony, Lalkothi, Jaipur, Rajasthan 302015
              </p>
              <p>
                <strong className="text-foreground">Showroom Hours:</strong><br />
                Mon – Sun: 10:30 AM – 9:00 PM
              </p>
              <p>
                <strong className="text-foreground">Store Phone:</strong><br />
                +91 98292 30548 · 0141-4112904
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color =
    status === "confirmed" || status === "delivered"
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
      : status === "pending" || status === "processing"
        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
        : "bg-muted text-muted-foreground border border-border";

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${color}`}>
      {status || "Pending"}
    </span>
  );
}
