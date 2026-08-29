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
    { to: "/admin/products", icon: Package, label: "Products", permission: "products.view" },
    { to: "/admin/orders", icon: ShoppingBag, label: "Orders", permission: "orders.view" },
    { to: "/admin/staff", icon: Users, label: "Staff", permission: "staff.view" },
    { to: "/admin/activity", icon: History, label: "Activity", permission: "activity.view" },
    { to: "/admin/security", icon: ShieldCheck, label: "Security", permission: "security.view" },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4">
          <Link to="/admin/dashboard" className="font-display text-lg tracking-tight whitespace-nowrap">
            Lens Master <span className="text-muted-foreground">Admin</span>
          </Link>
          <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
            {nav
              .filter((item) => hasPermission(perms, item.permission))
              .map((item) => (
                <NavLink key={item.to} to={item.to} icon={item.icon} label={item.label} />
              ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/admin/account"
              className="hidden items-center gap-2 rounded-full border px-3 py-1.5 text-xs sm:flex"
            >
              <UserCircle2 className="h-4 w-4" />
              <span className="max-w-[10rem] truncate">{user?.name || user?.email}</span>
              <span className="text-muted-foreground">
                {user ? ROLE_LABELS[user.role as AdminRole] : ""}
              </span>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1"
              onClick={async () => {
                await queryClient.cancelQueries();
                await logout();
                queryClient.clear();
                navigate({ to: "/admin/login", replace: true });
              }}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {user?.mustChangePassword && (
        <div className="border-b bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">
          For security, please{" "}
          <Link to="/admin/account" className="font-medium underline">
            set a new password
          </Link>
          .
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

function NavLink({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      activeProps={{ className: "bg-accent text-foreground" }}
    >
      <Icon className="h-4 w-4" />
      <span className="hidden md:inline">{label}</span>
    </Link>
  );
}
