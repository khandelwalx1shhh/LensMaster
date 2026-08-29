/**
 * Client-side helpers for the admin UI.
 * These are conveniences only — the server re-checks auth, CSRF and permissions.
 */
export const CSRF_COOKIE = "lm_admin_csrf";

export function getCsrfToken(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp(`(?:^|; )${CSRF_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]!) : "";
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}
