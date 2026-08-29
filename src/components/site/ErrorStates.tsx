import { Link, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { reportLovableError } from "@/lib/lovable-error-reporting";

/**
 * User-facing error surfaces. These NEVER render error messages, stack traces
 * or provider details — technical detail is logged/reported only.
 */

export function DefaultNotFoundPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-5 py-20">
      <div className="max-w-md text-center">
        <h1 className="font-display text-6xl font-light">404</h1>
        <h2 className="mt-4 font-display text-xl">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has moved.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition hover:bg-foreground/90"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}

export function DefaultErrorPage({ error, reset }: { error: Error; reset?: () => void }) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
    reportLovableError(error, { boundary: "route_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-5 py-20">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl font-light">Something went wrong</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          We couldn't load this page just now. Please try again — or message us on WhatsApp and
          we'll help you right away.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset?.();
            }}
            className="inline-flex items-center justify-center rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition hover:bg-foreground/90"
          >
            Try again
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full border border-border px-6 py-2.5 text-sm font-medium transition hover:bg-muted"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
