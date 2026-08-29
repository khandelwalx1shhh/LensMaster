import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  listStaff,
  createStaff,
  updateStaff,
  revokeStaffSessions,
  issueResetLink,
} from "@/lib/admin/staff.functions";
import { adminMe } from "@/lib/admin/auth.functions";
import { ADMIN_ROLES, ROLE_LABELS, hasPermission, type AdminRole } from "@/lib/admin/permissions";
import { getCsrfToken, formatDateTime } from "@/lib/admin/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserPlus, ShieldOff, KeyRound } from "lucide-react";

export const Route = createFileRoute("/admin/staff")({
  ssr: false,
  component: StaffPage,
});

function StaffPage() {
  const queryClient = useQueryClient();
  const { data: me } = useQuery({ queryKey: ["admin", "me"], queryFn: () => adminMe() });
  const perms = me?.authenticated ? me.user.permissions : [];
  const canManage = hasPermission(perms, "staff.manage");

  const { data: staff, isLoading } = useQuery({
    queryKey: ["admin", "staff"],
    queryFn: () => listStaff(),
  });

  const create = useServerFn(createStaff);
  const update = useServerFn(updateStaff);
  const revoke = useServerFn(revokeStaffSessions);
  const reset = useServerFn(issueResetLink);

  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [resetLink, setResetLink] = useState("");

  if (me?.authenticated && !hasPermission(perms, "staff.view")) return <AccessDenied />;

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["admin", "staff"] });
  }

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await create({
      data: {
        email: String(form.get("email") ?? ""),
        name: String(form.get("name") ?? ""),
        role: String(form.get("role") ?? ""),
        password: String(form.get("password") ?? ""),
        requireMfa: form.get("requireMfa") === "on",
        confirmPassword: String(form.get("confirmPassword") ?? ""),
        csrfToken: getCsrfToken(),
      },
    });
    if (!res.ok) {
      setMessage(res.message);
      return;
    }
    setMessage("");
    setOpen(false);
    await refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl tracking-tight">Staff &amp; roles</h1>
          <p className="text-sm text-muted-foreground">
            Least-privilege access. Every change is logged and requires your password.
          </p>
        </div>
        {canManage && (
          <Button className="gap-2 rounded-full" onClick={() => setOpen(true)}>
            <UserPlus className="h-4 w-4" /> Add staff
          </Button>
        )}
      </div>

      {resetLink && (
        <div className="rounded-xl border bg-muted/40 p-4 text-sm">
          <p className="font-medium">One-time reset link (valid 60 minutes)</p>
          <code className="mt-1 block break-all text-xs">{resetLink}</code>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading staff…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Member</th>
                <th className="px-4 py-3 text-left font-medium">Role</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">2FA</th>
                <th className="px-4 py-3 text-left font-medium">Last login</th>
                {canManage && <th className="px-4 py-3 text-right font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {(staff ?? []).map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    {canManage ? (
                      <Select
                        value={s.role}
                        onValueChange={async (role) => {
                          const confirmPassword = window.prompt("Confirm your password") ?? "";
                          if (!confirmPassword) return;
                          const res = await update({
                            data: { id: s.id, role, confirmPassword, csrfToken: getCsrfToken() },
                          });
                          if (!res.ok) setMessage(res.message);
                          await refresh();
                        }}
                      >
                        <SelectTrigger className="h-8 w-[11rem]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ADMIN_ROLES.map((role) => (
                            <SelectItem key={role} value={role}>
                              {ROLE_LABELS[role as AdminRole]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="secondary">{ROLE_LABELS[s.role as AdminRole]}</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={s.status === "ACTIVE" ? "default" : "secondary"}>
                      {s.status}
                    </Badge>
                    {s.locked_until && new Date(s.locked_until) > new Date() && (
                      <span className="ml-2 text-xs text-destructive">locked</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {s.mfa_enabled ? "Enabled" : s.mfa_required ? "Required" : "Off"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {formatDateTime(s.last_login_at)}
                  </td>
                  {canManage && (
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1"
                          onClick={async () => {
                            await revoke({ data: { id: s.id, csrfToken: getCsrfToken() } });
                            await refresh();
                          }}
                        >
                          <ShieldOff className="h-4 w-4" />
                          <span className="hidden lg:inline">Sign out</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1"
                          onClick={async () => {
                            const confirmPassword = window.prompt("Confirm your password") ?? "";
                            if (!confirmPassword) return;
                            const res = await reset({
                              data: { id: s.id, confirmPassword, csrfToken: getCsrfToken() },
                            });
                            if (res.ok) setResetLink(`${window.location.origin}${res.path}`);
                            else setMessage(res.message);
                          }}
                        >
                          <KeyRound className="h-4 w-4" />
                          <span className="hidden lg:inline">Reset</span>
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {message && <p className="text-sm text-destructive">{message}</p>}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add staff member</DialogTitle>
          </DialogHeader>
          <form onSubmit={onCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" name="name" required maxLength={80} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required maxLength={254} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                name="role"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                defaultValue="SALES_STAFF"
              >
                {ADMIN_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role as AdminRole]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Temporary password</Label>
              <Input id="password" name="password" type="password" required minLength={12} />
              <p className="text-xs text-muted-foreground">
                Minimum 12 characters with upper, lower, number and symbol.
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="requireMfa" defaultChecked /> Require two-factor
              authentication
            </label>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm with your password</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" required />
            </div>
            {message && <p className="text-sm text-destructive">{message}</p>}
            <Button type="submit" className="w-full rounded-full">
              Create staff member
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AccessDenied() {
  return (
    <div className="rounded-xl border bg-card p-8 text-center">
      <h1 className="font-display text-xl">Access denied</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Your role does not have permission to view this section.
      </p>
    </div>
  );
}
