"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useCartStore } from "@/stores/cart";
import { CartSheet } from "@/components/storefront/cart-sheet";

type CartUIContextValue = {
  openCart: () => void;
  closeCart: () => void;
};

const CartUIContext = createContext<CartUIContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    void useCartStore.persist.rehydrate();
  }, []);

  return (
    <CartUIContext.Provider
      value={{ openCart: () => setOpen(true), closeCart: () => setOpen(false) }}
    >
      {children}
      <CartSheet open={open} onOpenChange={setOpen} />
    </CartUIContext.Provider>
  );
}

export function useCartUI() {
  const context = useContext(CartUIContext);
  if (!context) {
    throw new Error("useCartUI must be used inside CartProvider.");
  }
  return context;
}
