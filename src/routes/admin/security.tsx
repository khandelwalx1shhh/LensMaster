import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listSecurityEvents } from "@/lib/admin/staff.functions";
import { adminMe } from "@/lib/admin/auth.functions";
import { hasPermission } from "@/lib/admin/permissions";
import { formatDateTime } from "@/lib/admin/client";
import { Input } from "@/components/ui/input";

const SEVERITIES = ["", "info", "warning", "critical"];

export const Route = createFileRoute("/admin/security")({
  ssr: false,
  component: SecurityPage,
});

function SecurityPage() {
  const [severity, setSeverity] = useState("");
  const [search, setSearch] = useState("");
  const { data: me } = useQuery({ queryKey: ["admin", "me"], queryFn: () => adminMe() });
  const perms = me?.authenticated ? me.user.permissions : [];

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "security", severity, search],
    queryFn: () => listSecurityEvents({ data: { severity: severity || undefined, search } }),
  });

  if (me?.authenticated && !hasPermission(perms, "security.view")) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center">
        <h1 className="font-display text-xl">Access denied</h1>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl tracking-tight">Security events</h1>
        <p className="text-sm text-muted-foreground">
          Logins, lockouts, permission denials and session activity.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {SEVERITIES.map((s) => (
          <button
            key={s || "all"}
            onClick={() => setSeverity(s)}
            className={`rounded-full border px-3 py-1.5 text-xs capitalize transition-colors ${
              severity === s ? "bg-foreground text-background" : "hover:bg-accent"
            }`}
          >
            {s || "All"}
          </button>
        ))}
        <Input
          placeholder="Search email, event or resource…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-full sm:w-72"
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading events…</p>
      ) : !data || data.length === 0 ? (
        <p className="rounded-xl border p-6 text-sm text-muted-foreground">No events recorded.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">When</th>
                <th className="px-4 py-3 text-left font-medium">Actor</th>
                <th className="px-4 py-3 text-left font-medium">Event</th>
                <th className="px-4 py-3 text-left font-medium">Result</th>
                <th className="px-4 py-3 text-left font-medium">Severity</th>
                <th className="px-4 py-3 text-left font-medium">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                    {formatDateTime(row.created_at)}
                  </td>
                  <td className="px-4 py-3">{row.actor_email ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div>{row.event}</div>
                    {row.resource && (
                      <div className="text-xs text-muted-foreground">{row.resource}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">{row.result}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        row.severity === "critical"
                          ? "bg-red-100 text-red-700"
                          : row.severity === "warning"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {row.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{row.ip ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
