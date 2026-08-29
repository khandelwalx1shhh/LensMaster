import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

type OAuthNamespace = {
  getAuthorizationDetails: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
};

interface AuthorizationDetails {
  client?: { name?: string } | null;
  redirect_url?: string;
  redirect_to?: string;
}

function oauthApi(): OAuthNamespace {
  return (supabase.auth as unknown as { oauth: OAuthNamespace }).oauth;
}

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: ({ search }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) return { signedIn: false as const, details: null };
    const { data, error } = await oauthApi().getAuthorizationDetails(authorizationId);
    if (error) throw error;
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return { signedIn: true as const, details: data };
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-3 px-6">
      <h1 className="text-xl font-medium">Authorization request failed</h1>
      <p className="text-sm text-muted-foreground">
        {String((error as Error)?.message ?? error)}
      </p>
    </main>
  ),
});

function Consent() {
  const data = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setBusy(true);
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.href,
    });
    if (result?.error) {
      setBusy(false);
      setError(result.error.message);
      return;
    }
    if (!("redirected" in result && result.redirected)) {
      window.location.reload();
    }
  }

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const api = oauthApi();
    const { data: result, error: decideError } = approve
      ? await api.approveAuthorization(authorization_id)
      : await api.denyAuthorization(authorization_id);
    if (decideError) {
      setBusy(false);
      setError(decideError.message);
      return;
    }
    const target = result?.redirect_url ?? result?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  const clientName = data.details?.client?.name ?? "an app";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Lens Master</p>
        <h1 className="text-2xl font-medium">
          {data.signedIn ? `Connect ${clientName} to Lens Master` : "Sign in to continue"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {data.signedIn
            ? `${clientName} will be able to read the Lens Master catalogue — products, prices, collections and stock — as you.`
            : "Sign in to review and approve this connection request."}
        </p>
      </header>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {data.signedIn ? (
        <div className="flex gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => decide(true)}
            className="flex-1 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            Approve
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => decide(false)}
            className="flex-1 rounded-full border border-border px-5 py-3 text-sm font-medium disabled:opacity-50"
          >
            Deny
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={signIn}
          className="rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          Continue with Google
        </button>
      )}
    </main>
  );
}
