/**
 * Tiny in-memory TTL cache for Shopify catalogue reads.
 *
 * Shopify Admin API calls dominate page latency (token + GraphQL round trip).
 * Catalogue data changes rarely compared to how often it is read, so we cache
 * results per worker instance for a short window. In-flight requests are shared
 * so a burst of visitors triggers a single upstream call.
 */
type Entry<T> = { value: T; expires: number };

const cache = new Map<string, Entry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

export const CATALOG_TTL_MS = 60_000;

export async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const hit = cache.get(key) as Entry<T> | undefined;
  if (hit && hit.expires > now) return hit.value;

  const running = inflight.get(key) as Promise<T> | undefined;
  if (running) return running;

  const promise = load()
    .then((value) => {
      cache.set(key, { value, expires: Date.now() + ttlMs });
      return value;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, promise);
  return promise;
}
