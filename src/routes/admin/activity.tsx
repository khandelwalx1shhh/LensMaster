import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listActivity } from "@/lib/admin/staff.functions";
import { adminMe } from "@/lib/admin/auth.functions";
import { hasPermission } from "@/lib/admin/permissions";
import { formatDateTime } from "@/lib/admin/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const MODULES = ["", "orders", "products", "staff", "security", "settings"];

export const Route = createFileRoute("/admin/activity")({
  ssr: false,
  component: ActivityPage,
});

function ActivityPage() {
  const [module, setModule] = useState("");
  const [search, setSearch] = useState("");
  const { data: me } = useQuery({ queryKey: ["admin", "me"], queryFn: () => adminMe() });
  const perms = me?.authenticated ? me.user.permissions : [];

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "activity", module, search],
    queryFn: () => listActivity({ data: { module: module || undefined, search } }),
  });

  if (me?.authenticated && !hasPermission(perms, "activity.view")) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center">
        <h1 className="font-display text-xl">Access denied</h1>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl tracking-tight">Activity log</h1>
        <p className="text-sm text-muted-foreground">
          Immutable record of every admin action, with before/after values.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {MODULES.map((m) => (
          <button
            key={m || "all"}
            onClick={() => setModule(m)}
            className={`rounded-full border px-3 py-1.5 text-xs capitalize transition-colors ${
              module === m ? "bg-foreground text-background" : "hover:bg-accent"
            }`}
          >
            {m || "All"}
          </button>
        ))}
        <Input
          placeholder="Search actor, action or record…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-full sm:w-72"
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading activity…</p>
      ) : !data || data.length === 0 ? (
        <p className="rounded-xl border p-6 text-sm text-muted-foreground">No activity recorded.</p>
      ) : (
        <ul className="space-y-2">
          {data.map((row) => (
            <li key={row.id} className="rounded-xl border bg-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="capitalize">
                  {row.module}
                </Badge>
                <span className="text-sm font-medium">{row.action}</span>
                {row.entity_label && (
                  <span className="text-sm text-muted-foreground">— {row.entity_label}</span>
                )}
                <span className="ml-auto text-xs text-muted-foreground">
                  {formatDateTime(row.created_at)}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">by {row.actor_email ?? "system"}</p>
              {(row.previous_value || row.new_value) && (
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <pre className="overflow-x-auto rounded-lg bg-muted/50 p-2 text-[11px]">
                    {JSON.stringify(row.previous_value ?? {}, null, 1)}
                  </pre>
                  <pre className="overflow-x-auto rounded-lg bg-muted/50 p-2 text-[11px]">
                    {JSON.stringify(row.new_value ?? {}, null, 1)}
                  </pre>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
