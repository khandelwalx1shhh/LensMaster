import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { adminLogin, adminVerifyMfa } from "@/lib/admin/auth.functions";
import { requestPasswordReset } from "@/lib/admin/staff.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/admin/login")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { step?: "mfa" } =>
    search["step"] === "mfa" ? { step: "mfa" } : {},
  head: () => ({
    meta: [
      { title: "Admin Sign In — Lens Master" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLogin,
});

type Mode = "password" | "mfa" | "forgot";

function AdminLogin() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const login = useServerFn(adminLogin);
  const verifyMfa = useServerFn(adminVerifyMfa);
  const forgot = useServerFn(requestPasswordReset);

  const [mode, setMode] = useState<Mode>(search.step === "mfa" ? "mfa" : "password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [challenge, setChallenge] = useState<{ token: string; question: string } | null>(null);
  const [challengeAnswer, setChallengeAnswer] = useState("");
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function onPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await login({
        data: {
          email,
          password,
          challengeToken: challenge?.token,
          challengeAnswer,
        },
      });
      if (res.status === "challenge") {
        setChallenge(res.challenge);
        setChallengeAnswer("");
        setMessage("Please complete the verification below.");
        return;
      }
      if (res.status === "error") {
        if ("challenge" in res && res.challenge)
          setChallenge(res.challenge as { token: string; question: string });
        setChallengeAnswer("");
        setMessage(res.message);
        return;
      }
      setPassword("");
      if (res.status === "mfa") {
        setMode("mfa");
        setMessage("");
        return;
      }
      window.location.replace("/admin/dashboard");
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function onMfaSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await verifyMfa({ data: { code } });
      if (res.status === "ok") {
        window.location.replace("/admin/dashboard");
        return;
      }
      setMessage(res.message);
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function onForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await forgot({ data: { email } });
    } catch {
      /* response is intentionally identical either way */
    }
    setNotice(
      "If that email belongs to an admin account, a reset has been created. Ask a Super Admin for the reset link.",
    );
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm space-y-5 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h1 className="font-display text-2xl tracking-tight">Lens Master Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "mfa"
              ? "Enter the 6-digit code from your authenticator app."
              : mode === "forgot"
                ? "Request a password reset."
                : "Authorised staff only."}
          </p>
        </div>

        {mode === "password" && (
          <form onSubmit={onPasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                required
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                maxLength={200}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11"
              />
            </div>
            {challenge && (
              <div className="space-y-2 rounded-lg border bg-muted/40 p-3">
                <Label htmlFor="challenge">{challenge.question}</Label>
                <Input
                  id="challenge"
                  inputMode="numeric"
                  required
                  value={challengeAnswer}
                  onChange={(e) => setChallengeAnswer(e.target.value)}
                  className="h-10"
                />
              </div>
            )}
            {message && <p className="text-sm text-destructive">{message}</p>}
            <Button type="submit" className="h-11 w-full rounded-full" disabled={loading}>
              {loading ? "Checking…" : "Sign in"}
            </Button>
            <button
              type="button"
              className="w-full text-center text-xs text-muted-foreground hover:underline"
              onClick={() => {
                setMode("forgot");
                setMessage("");
              }}
            >
              Forgot password?
            </button>
          </form>
        )}

        {mode === "mfa" && (
          <form onSubmit={onMfaSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Authentication code</Label>
              <Input
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="h-11 tracking-[0.4em]"
                placeholder="000000"
              />
              <p className="text-xs text-muted-foreground">
                You can also use one of your backup codes.
              </p>
            </div>
            {message && <p className="text-sm text-destructive">{message}</p>}
            <Button type="submit" className="h-11 w-full rounded-full" disabled={loading}>
              {loading ? "Verifying…" : "Verify"}
            </Button>
          </form>
        )}

        {mode === "forgot" && (
          <form onSubmit={onForgotSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email</Label>
              <Input
                id="forgot-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
              />
            </div>
            {notice && <p className="text-sm text-muted-foreground">{notice}</p>}
            <Button type="submit" className="h-11 w-full rounded-full" disabled={loading}>
              {loading ? "Sending…" : "Request reset"}
            </Button>
            <button
              type="button"
              className="w-full text-center text-xs text-muted-foreground hover:underline"
              onClick={() => {
                setMode("password");
                setNotice("");
              }}
            >
              Back to sign in
            </button>
          </form>
        )}

        <button
          type="button"
          className="w-full text-center text-xs text-muted-foreground hover:underline"
          onClick={() => navigate({ to: "/" })}
        >
          Return to store
        </button>
      </div>
    </main>
  );
}
