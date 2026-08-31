import { createFileRoute, Outlet, redirect, Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  UserCircle2,
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
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin", "me"], queryFn: () => adminMe() });
  const user = data?.authenticated ? data.user : undefined;
  const perms = user?.permissions ?? [];

  const nav: { to: string; icon: React.ElementType; label: string; permission: Permission }[] = [
    { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard", permission: "dashboard.view" },
    { to: "/admin/orders", icon: ShoppingBag, label: "Orders", permission: "orders.view" },
    { to: "/admin/products", icon: Package, label: "Products", permission: "products.view" },
    { to: "/admin/staff", icon: Users, label: "Staff", permission: "staff.view" },
    { to: "/admin/activity", icon: History, label: "Activity", permission: "activity.view" },
    { to: "/admin/security", icon: ShieldCheck, label: "Security", permission: "security.view" },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-zinc-950 font-sans antialiased text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link to="/admin/dashboard" className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background font-bold text-sm shadow-sm">
                LM
              </span>
              <div className="flex flex-col">
                <span className="text-sm font-bold leading-none tracking-tight">Lens Master</span>
                <span className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase mt-0.5">Control Center</span>
              </div>
            </Link>
          </div>

          <nav className="flex items-center gap-1 overflow-x-auto py-1 px-1 bg-muted/60 rounded-xl p-1 border border-border/40">
            {nav
              .filter((item) => hasPermission(perms, item.permission))
              .map((item) => (
                <NavLink key={item.to} to={item.to} icon={item.icon} label={item.label} />
              ))}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
            >
              <span>Live Store</span>
              <span className="text-muted-foreground/60">↗</span>
            </a>

            <div className="h-4 w-px bg-border/60 hidden lg:block" />

            <Link
              to="/admin/account"
              className="flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1.5 text-xs hover:bg-card transition-colors shadow-sm"
            >
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="max-w-[8rem] sm:max-w-[10rem] truncate font-medium">{user?.name || user?.email || "Store Owner"}</span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                {user ? ROLE_LABELS[user.role as AdminRole] || "Admin" : "Admin"}
              </span>
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

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}

function NavLink({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:text-foreground hover:bg-background/80"
      activeProps={{ className: "bg-background text-foreground shadow-xs font-semibold" }}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
    </Link>
  );
}
