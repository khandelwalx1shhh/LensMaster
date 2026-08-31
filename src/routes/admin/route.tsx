import { createFileRoute, Outlet, redirect, Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminMe, adminLogout } from "@/lib/admin/auth.functions";
import { hasPermission, ROLE_LABELS, type AdminRole, type Permission } from "@/lib/admin/permissions";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  Package,
  ShoppingBag,
  LayoutDashboard,
  ShieldCheck,
  Users,
  History,
  Store,
  ExternalLink,
  MessageCircle,
  Menu,
  X,
  ChevronRight,
  Sparkles,
} from "lucide-react";

const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/reset-password"];

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    if (PUBLIC_ADMIN_PATHS.includes(location.pathname)) return;
    const res = await adminMe().catch(() => null);
    if (!res?.authenticated) throw redirect({ to: "/admin/login" });
    if (res.mfaPending) throw redirect({ to: "/admin/login", search: { step: "mfa" } });
  },
  component: AdminLayout,
});

function AdminLayout() {
  const location = useLocation();
  if (PUBLIC_ADMIN_PATHS.includes(location.pathname)) return <Outlet />;
  return <AdminShell />;
}

function AdminShell() {
  const logout = useServerFn(adminLogout);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { data } = useQuery({ queryKey: ["admin", "me"], queryFn: () => adminMe() });
  const user = data?.authenticated ? data.user : undefined;
  const perms = user?.permissions ?? [];

  const mainNav: { to: string; icon: React.ElementType; label: string; permission: Permission }[] = [
    { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard", permission: "dashboard.view" },
    { to: "/admin/orders", icon: ShoppingBag, label: "Orders & Fulfillment", permission: "orders.view" },
    { to: "/admin/products", icon: Package, label: "Eyewear Catalog", permission: "products.view" },
  ];

  const manageNav: { to: string; icon: React.ElementType; label: string; permission: Permission }[] = [
    { to: "/admin/staff", icon: Users, label: "Opticians & Staff", permission: "staff.view" },
    { to: "/admin/activity", icon: History, label: "Audit & Logs", permission: "activity.view" },
    { to: "/admin/security", icon: ShieldCheck, label: "Security & MFA", permission: "security.view" },
  ];

  const currentPageTitle =
    [...mainNav, ...manageNav].find((item) => location.pathname.startsWith(item.to))?.label || "Admin";

  return (
    <div className="min-h-screen bg-slate-50/80 dark:bg-zinc-950 font-sans antialiased text-foreground flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border/70 bg-card/70 backdrop-blur-md sticky top-0 h-screen z-30 justify-between shrink-0">
        <div className="flex flex-col h-full overflow-y-auto p-4 space-y-6">
          {/* Brand Header */}
          <div className="px-2 py-1">
            <Link to="/admin/dashboard" className="flex items-center gap-3 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-bold text-base shadow-sm group-hover:scale-105 transition-transform">
                LM
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-display font-black text-base leading-tight tracking-tight text-foreground truncate">
                  Lens Master
                </span>
                <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase mt-0.5 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Jaipur HQ • Production
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Groups */}
          <div className="space-y-5 flex-1">
            <div className="space-y-1">
              <span className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                Store Operations
              </span>
              <nav className="space-y-1 pt-1.5">
                {mainNav
                  .filter((item) => hasPermission(perms, item.permission))
                  .map((item) => (
                    <SidebarNavLink key={item.to} to={item.to} icon={item.icon} label={item.label} />
                  ))}
              </nav>
            </div>

            <div className="space-y-1">
              <span className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                Management
              </span>
              <nav className="space-y-1 pt-1.5">
                {manageNav
                  .filter((item) => hasPermission(perms, item.permission))
                  .map((item) => (
                    <SidebarNavLink key={item.to} to={item.to} icon={item.icon} label={item.label} />
                  ))}
              </nav>
            </div>

            <div className="space-y-1">
              <span className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                Storefront Links
              </span>
              <div className="space-y-1 pt-1.5 text-xs">
                <a
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors font-medium"
                >
                  <span className="flex items-center gap-2.5">
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                    Live Storefront
                  </span>
                  <span className="text-[10px] text-muted-foreground">↗</span>
                </a>
                <a
                  href="/lens-master-jaipur"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors font-medium"
                >
                  <span className="flex items-center gap-2.5">
                    <Store className="h-3.5 w-3.5 text-muted-foreground" />
                    Jaipur Store Page
                  </span>
                  <span className="text-[10px] text-muted-foreground">↗</span>
                </a>
                <a
                  href="https://wa.me/919829230548"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-emerald-700 dark:text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors font-semibold"
                >
                  <span className="flex items-center gap-2.5">
                    <MessageCircle className="h-3.5 w-3.5" />
                    Store WhatsApp
                  </span>
                  <span className="text-[10px]">↗</span>
                </a>
              </div>
            </div>
          </div>

          {/* User Profile & Logout Bottom Card */}
          <div className="pt-3 border-t border-border/60">
            <div className="flex items-center justify-between p-2 rounded-2xl bg-muted/40 border border-border/40">
              <Link to="/admin/account" className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-80">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-xs uppercase">
                  {user?.name?.[0] || user?.email?.[0] || "A"}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-foreground truncate">
                    {user?.name || user?.email || "Store Admin"}
                  </span>
                  <span className="text-[10px] font-semibold uppercase text-primary tracking-wider">
                    {user ? ROLE_LABELS[user.role as AdminRole] || "Admin" : "Super Admin"}
                  </span>
                </div>
              </Link>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                title="Sign Out"
                onClick={async () => {
                  await queryClient.cancelQueries();
                  await logout();
                  queryClient.clear();
                  navigate({ to: "/admin/login", replace: true });
                }}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Body */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-md">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-8">
            {/* Mobile Hamburger & Page Title */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="md:hidden h-9 w-9 p-0 rounded-xl"
                onClick={() => setMobileNavOpen(!mobileNavOpen)}
              >
                {mobileNavOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="hidden sm:inline font-medium">Lens Master Control</span>
                <ChevronRight className="h-3 w-3 hidden sm:inline" />
                <span className="font-bold text-foreground text-sm">{currentPageTitle}</span>
              </div>
            </div>

            {/* Top Right Live Health Chips */}
            <div className="flex items-center gap-2.5">
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/60 bg-card/60 text-[11px] text-muted-foreground">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>Shopify API</span>
                <span className="text-border">•</span>
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>Razorpay Live</span>
                <span className="text-border">•</span>
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>WhatsApp Active</span>
              </div>

              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-xs"
              >
                <span>Live Store</span>
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </a>
            </div>
          </div>

          {/* Mobile Drawer Navigation */}
          {mobileNavOpen && (
            <div className="md:hidden border-b border-border/60 bg-card p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
              <nav className="space-y-1">
                {[...mainNav, ...manageNav]
                  .filter((item) => hasPermission(perms, item.permission))
                  .map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileNavOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                      activeProps={{ className: "bg-primary text-primary-foreground font-bold" }}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  ))}
              </nav>

              <div className="pt-2 border-t border-border/50 flex justify-between items-center">
                <span className="text-xs text-muted-foreground">{user?.email}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await queryClient.cancelQueries();
                    await logout();
                    queryClient.clear();
                    navigate({ to: "/admin/login", replace: true });
                  }}
                  className="rounded-xl text-xs"
                >
                  Logout
                </Button>
              </div>
            </div>
          )}
        </header>

        {user?.mustChangePassword && (
          <div className="border-b border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-center text-xs font-medium text-amber-900 dark:text-amber-200">
            For security, please{" "}
            <Link to="/admin/account" className="underline font-semibold hover:text-amber-950 dark:hover:text-white">
              set a new personal password
            </Link>
            .
          </div>
        )}

        {/* Dynamic Route Content */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarNavLink({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium text-muted-foreground transition-all hover:text-foreground hover:bg-muted/70 group"
      activeProps={{ className: "bg-primary text-primary-foreground font-bold shadow-xs hover:bg-primary hover:text-primary-foreground" }}
    >
      <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-105" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

