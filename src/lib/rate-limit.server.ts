/**
 * Lightweight in-memory rate limiter for public server functions and routes.
 *
 * Protects customer-facing lookups (order tracking, phone lookup) from
 * enumeration and brute-force. Per-isolate only — it is a mitigation, not a
 * global quota; admin auth keeps its own database-backed limiter.
 */
import { getRequestHeader } from "@tanstack/react-start/server";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_KEYS = 5000;

/** Best-effort client IP from proxy headers. Falls back to a shared bucket. */
export function getClientIp(): string {
  const candidates = [
    getRequestHeader("cf-connecting-ip"),
    getRequestHeader("x-real-ip"),
    (getRequestHeader("x-forwarded-for") ?? "").split(",")[0]?.trim(),
  ];
  const ip = candidates.find((v) => v && v.length > 0);
  return (ip ?? "unknown").slice(0, 64);
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

/** Fixed-window limiter. Returns whether the call may proceed. */
export function rateLimit(scope: string, limit: number, windowMs: number, key?: string): RateLimitResult {
  const now = Date.now();
  const id = `${scope}:${key ?? getClientIp()}`;

  if (buckets.size > MAX_KEYS) {
    for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
    if (buckets.size > MAX_KEYS) buckets.clear();
  }

  const existing = buckets.get(id);
  if (!existing || existing.resetAt <= now) {
    buckets.set(id, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  if (existing.count > limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000) };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

/** Throws a generic error when the caller exceeded the limit. */
export function enforceRateLimit(scope: string, limit: number, windowMs: number, key?: string): void {
  const result = rateLimit(scope, limit, windowMs, key);
  if (!result.allowed) {
    console.warn("[rate-limit] blocked request", { scope });
    throw new Error("TOO_MANY_REQUESTS");
  }
}
