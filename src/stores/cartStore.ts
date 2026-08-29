import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { type ShopifyProduct, type ShopifyVariant } from "@/lib/shopify";

const newLocalLineId = () =>
  `local-line-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export interface CartItem {
  lineId: string | null;
  product: ShopifyProduct;
  variantId: string;
  variantTitle: string;
  price: { amount: string; currencyCode: string };
  quantity: number;
  selectedOptions: Array<{ name: string; value: string }>;
  attributes?: Array<{ key: string; value: string }>;
}

interface CartStore {
  items: CartItem[];
  isLoading: boolean;
  isOpen: boolean;
  setOpen: (v: boolean) => void;
  addItem: (item: Omit<CartItem, "lineId">) => Promise<void>;
  updateQuantity: (lineId: string, quantity: number) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
  updateLineAttributes: (
    lineId: string,
    attributes: Array<{ key: string; value: string }>,
    price?: { amount: string; currencyCode: string },
  ) => Promise<void>;
  clearCart: () => void;
  getCheckoutUrl: () => string | null;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      isOpen: false,
      setOpen: (v) => set({ isOpen: v }),

      addItem: async (item) => {
        const { items } = get();
        const attrKey = JSON.stringify(item.attributes ?? []);
        const existing = items.find(
          (i) => i.variantId === item.variantId && JSON.stringify(i.attributes ?? []) === attrKey,
        );
        set({ isLoading: true });

        if (existing) {
          set({
            items: items.map((i) =>
              i.lineId === existing.lineId ? { ...i, quantity: i.quantity + item.quantity } : i,
            ),
            isOpen: true,
          });
        } else {
          set({
            items: [...items, { ...item, lineId: newLocalLineId() }],
            isOpen: true,
          });
        }
        set({ isLoading: false });
      },

      updateQuantity: async (lineId, quantity) => {
        if (quantity <= 0) return get().removeItem(lineId);
        const { items } = get();
        set({ items: items.map((i) => (i.lineId === lineId ? { ...i, quantity } : i)) });
      },

      updateLineAttributes: async (lineId, attributes, price) => {
        const { items } = get();
        set({
          items: items.map((i) =>
            i.lineId === lineId ? { ...i, attributes, ...(price ? { price } : {}) } : i,
          ),
        });
      },

      removeItem: async (lineId) => {
        const { items } = get();
        const rest = items.filter((i) => i.lineId !== lineId);
        if (rest.length === 0) get().clearCart();
        else set({ items: rest });
      },

      clearCart: () => set({ items: [], isOpen: false }),
      getCheckoutUrl: () => null,
    }),
    {
      name: "lensmaster-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
