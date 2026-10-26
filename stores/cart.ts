"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  MAX_LINE_QUANTITY,
  cartItemCount,
  cartSubtotalCentavos,
  clampCartQuantity,
  lineWarning,
} from "@/lib/cart-rules";

export { MAX_LINE_QUANTITY };
export const CART_STORAGE_KEY = "vapeshop-cart";
export const CART_SCHEMA_VERSION = 1;

export type CartLine = {
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  variantLabel: string;
  sku: string;
  unitPriceCentavos: number;
  imageUrl: string | null;
  imageAlt: string;
  stock: number;
  quantity: number;
};

export type NewCartLine = Omit<CartLine, "quantity">;

type CartState = {
  lines: CartLine[];
  addLine: (line: NewCartLine, quantity?: number) => void;
  increment: (variantId: string) => void;
  decrement: (variantId: string) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  removeLine: (variantId: string) => void;
  clearCart: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      addLine: (line, quantity = 1) =>
        set((state) => {
          const capped = clampCartQuantity(quantity, line.stock);
          if (capped <= 0) return state;
          const existing = state.lines.find((item) => item.variantId === line.variantId);
          if (existing) {
            return {
              lines: state.lines.map((item) =>
                item.variantId === line.variantId
                  ? {
                      ...item,
                      ...line,
                      quantity: clampCartQuantity(item.quantity + capped, line.stock),
                    }
                  : item,
              ),
            };
          }
          return { lines: [...state.lines, { ...line, quantity: capped }] };
        }),
      increment: (variantId) =>
        set((state) => ({
          lines: state.lines.map((line) =>
            line.variantId === variantId
              ? { ...line, quantity: clampCartQuantity(line.quantity + 1, line.stock) }
              : line,
          ),
        })),
      decrement: (variantId) =>
        set((state) => ({
          lines: state.lines.map((line) =>
            line.variantId === variantId
              ? { ...line, quantity: clampCartQuantity(line.quantity - 1, line.stock) }
              : line,
          ),
        })),
      setQuantity: (variantId, quantity) =>
        set((state) => ({
          lines: state.lines.map((line) =>
            line.variantId === variantId
              ? { ...line, quantity: clampCartQuantity(quantity, line.stock) }
              : line,
          ),
        })),
      removeLine: (variantId) =>
        set((state) => ({ lines: state.lines.filter((line) => line.variantId !== variantId) })),
      clearCart: () => set({ lines: [] }),
    }),
    {
      name: CART_STORAGE_KEY,
      version: CART_SCHEMA_VERSION,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({ lines: state.lines }),
      migrate: (persisted) => {
        const value = persisted as { lines?: CartLine[] } | undefined;
        if (!value?.lines || !Array.isArray(value.lines)) return { lines: [] };
        return {
          lines: value.lines.filter(
            (line) =>
              typeof line?.variantId === "string" &&
              typeof line.productName === "string" &&
              Number.isInteger(line.quantity) &&
              line.quantity > 0,
          ),
        };
      },
    },
  ),
);

export const selectCartCount = (state: CartState) => cartItemCount(state.lines);

export const selectCartSubtotal = (state: CartState) => cartSubtotalCentavos(state.lines);

export function getLineWarning(line: CartLine) {
  return lineWarning(line);
}

export function useCartHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (useCartStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    const unsubscribe = useCartStore.persist.onFinishHydration(() => setHydrated(true));
    void useCartStore.persist.rehydrate();
    return unsubscribe;
  }, []);

  return hydrated;
}
