import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { resetPassword } from "@/lib/admin/staff.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin/reset-password")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { token: string } => ({
    token: typeof search["token"] === "string" ? search["token"] : "",
  }),
  head: () => ({
    meta: [
      { title: "Reset Admin Password — Lens Master" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { token } = Route.useSearch();
  const reset = useServerFn(resetPassword);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm space-y-5 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="text-center">
          <h1 className="font-display text-2xl tracking-tight">Set a new password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Minimum 12 characters with upper, lower, number and symbol.
          </p>
        </div>

        {done ? (
          <div className="space-y-4 text-center">
            <p className="text-sm">Password updated. You can sign in now.</p>
            <Button className="w-full rounded-full" onClick={() => window.location.replace("/admin/login")}>
              Go to sign in
            </Button>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const newPassword = String(new FormData(e.currentTarget).get("password") ?? "");
              const res = await reset({ data: { token, newPassword } });
              if (res.ok) setDone(true);
              else setMessage(res.message);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input id="password" name="password" type="password" required minLength={12} className="h-11" />
            </div>
            {message && <p className="text-sm text-destructive">{message}</p>}
            <Button type="submit" className="h-11 w-full rounded-full" disabled={!token}>
              Update password
            </Button>
            {!token && <p className="text-xs text-destructive">Missing or invalid reset link.</p>}
          </form>
        )}
      </div>
    </main>
  );
}
