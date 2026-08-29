import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  adminMe,
  adminChangePassword,
  adminListSessions,
  adminRevokeSession,
  adminLogoutAll,
  adminMfaSetup,
  adminMfaEnable,
  adminMfaDisable,
} from "@/lib/admin/auth.functions";
import { ROLE_LABELS, type AdminRole } from "@/lib/admin/permissions";
import { getCsrfToken, formatDateTime } from "@/lib/admin/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/account")({
  ssr: false,
  component: AccountPage,
});

function AccountPage() {
  const queryClient = useQueryClient();
  const { data: me } = useQuery({ queryKey: ["admin", "me"], queryFn: () => adminMe() });
  const user = me?.authenticated ? me.user : undefined;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl tracking-tight">My account</h1>
        <p className="text-sm text-muted-foreground">
          {user?.email} · {user ? ROLE_LABELS[user.role as AdminRole] : ""}
        </p>
      </div>

      <PasswordCard onDone={() => queryClient.invalidateQueries({ queryKey: ["admin", "me"] })} />
      <MfaCard
        enabled={!!user?.mfaEnabled}
        required={!!user?.mfaRequired}
        onDone={() => queryClient.invalidateQueries({ queryKey: ["admin", "me"] })}
      />
      <SessionsCard />
    </div>
  );
}

function Card({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="font-display text-lg tracking-tight">{title}</h2>
      <p className="mb-4 text-sm text-muted-foreground">{description}</p>
      {children}
    </section>
  );
}

function PasswordCard({ onDone }: { onDone: () => void }) {
  const change = useServerFn(adminChangePassword);
  const [message, setMessage] = useState("");

  return (
    <Card title="Password" description="Minimum 12 characters with upper, lower, number and symbol.">
      <form
        className="grid gap-3 sm:max-w-md"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          const res = await change({
            data: {
              currentPassword: String(form.get("current") ?? ""),
              newPassword: String(form.get("next") ?? ""),
              csrfToken: getCsrfToken(),
            },
          });
          setMessage(res.ok ? "Password updated. Other sessions were signed out." : res.message);
          if (res.ok) onDone();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="current">Current password</Label>
          <Input id="current" name="current" type="password" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="next">New password</Label>
          <Input id="next" name="next" type="password" required minLength={12} />
        </div>
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
        <Button type="submit" className="rounded-full">
          Update password
        </Button>
      </form>
    </Card>
  );
}

function MfaCard({ enabled, required, onDone }: { enabled: boolean; required: boolean; onDone: () => void }) {
  const setup = useServerFn(adminMfaSetup);
  const enable = useServerFn(adminMfaEnable);
  const disable = useServerFn(adminMfaDisable);
  const [uri, setUri] = useState("");
  const [secret, setSecret] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  return (
    <Card
      title="Two-factor authentication"
      description="Use an authenticator app (Google Authenticator, 1Password, Authy)."
    >
      <div className="mb-3 flex items-center gap-2">
        <Badge variant={enabled ? "default" : "secondary"}>{enabled ? "Enabled" : "Disabled"}</Badge>
        {required && <span className="text-xs text-muted-foreground">Required for your role</span>}
      </div>

      {!enabled && !uri && (
        <Button
          className="rounded-full"
          onClick={async () => {
            const res = await setup({ data: { csrfToken: getCsrfToken() } });
            setSecret(res.secret);
            setUri(res.uri);
          }}
        >
          Start setup
        </Button>
      )}

      {!enabled && uri && (
        <form
          className="grid gap-3 sm:max-w-md"
          onSubmit={async (e) => {
            e.preventDefault();
            const code = String(new FormData(e.currentTarget).get("code") ?? "");
            const res = await enable({ data: { code, csrfToken: getCsrfToken() } });
            if (!res.ok) {
              setMessage(res.message);
              return;
            }
            setBackupCodes(res.backupCodes);
            setUri("");
            setMessage("");
            onDone();
          }}
        >
          <p className="text-sm">Add this key to your authenticator app:</p>
          <code className="break-all rounded-lg bg-muted p-2 text-xs">{secret}</code>
          <a className="text-xs text-muted-foreground underline" href={uri}>
            Open in authenticator app
          </a>
          <div className="space-y-2">
            <Label htmlFor="code">Enter the 6-digit code</Label>
            <Input id="code" name="code" inputMode="numeric" required />
          </div>
          {message && <p className="text-sm text-destructive">{message}</p>}
          <Button type="submit" className="rounded-full">
            Enable two-factor
          </Button>
        </form>
      )}

      {backupCodes.length > 0 && (
        <div className="mt-4 rounded-lg border bg-muted/40 p-3">
          <p className="text-sm font-medium">Backup codes — store them safely, shown once.</p>
          <div className="mt-2 grid grid-cols-2 gap-1 font-mono text-xs sm:grid-cols-3">
            {backupCodes.map((c) => (
              <span key={c}>{c}</span>
            ))}
          </div>
        </div>
      )}

      {enabled && !required && (
        <form
          className="grid gap-3 sm:max-w-md"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            const res = await disable({
              data: {
                password: String(form.get("password") ?? ""),
                code: String(form.get("code") ?? ""),
                csrfToken: getCsrfToken(),
              },
            });
            setMessage(res.ok ? "Two-factor disabled." : res.message);
            if (res.ok) onDone();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="mfa-password">Password</Label>
            <Input id="mfa-password" name="password" type="password" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mfa-code">Current code</Label>
            <Input id="mfa-code" name="code" inputMode="numeric" required />
          </div>
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
          <Button type="submit" variant="outline" className="rounded-full">
            Disable two-factor
          </Button>
        </form>
      )}
    </Card>
  );
}

function SessionsCard() {
  const queryClient = useQueryClient();
  const revoke = useServerFn(adminRevokeSession);
  const logoutAll = useServerFn(adminLogoutAll);
  const { data } = useQuery({
    queryKey: ["admin", "sessions"],
    queryFn: () => adminListSessions(),
  });

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["admin", "sessions"] });
  }

  return (
    <Card title="Active sessions" description="Sign out devices you no longer recognise.">
      <ul className="divide-y rounded-lg border">
        {(data ?? []).map((s) => (
          <li key={s.id} className="flex flex-wrap items-center gap-2 p-3 text-sm">
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">
                {s.device_label ?? "Unknown device"} {s.current && <Badge className="ml-1">This device</Badge>}
              </div>
              <div className="text-xs text-muted-foreground">
                {s.ip ?? "—"} · last active {formatDateTime(s.last_active_at)}
              </div>
            </div>
            {!s.current && (
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  await revoke({ data: { sessionId: s.id, csrfToken: getCsrfToken() } });
                  await refresh();
                }}
              >
                Revoke
              </Button>
            )}
          </li>
        ))}
      </ul>
      <Button
        variant="outline"
        className="mt-3 rounded-full"
        onClick={async () => {
          await logoutAll({ data: { csrfToken: getCsrfToken() } });
          window.location.replace("/admin/login");
        }}
      >
        Sign out everywhere
      </Button>
    </Card>
  );
}
