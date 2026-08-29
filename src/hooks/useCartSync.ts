/**
 * Legacy hook — the cart is now local-only, so there is no server cart to sync.
 * Kept as a no-op so existing call sites don't need to change.
 */
export function useCartSync() {
  // no-op
}
