"use client";

import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartUI } from "@/components/storefront/cart-ui";
import { selectCartCount, useCartHydrated, useCartStore } from "@/stores/cart";

export function CartTrigger({ className }: { className?: string }) {
  const { openCart } = useCartUI();
  const hydrated = useCartHydrated();
  const count = useCartStore(selectCartCount);

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={className}
      onClick={openCart}
      aria-label={hydrated && count > 0 ? `Open cart, ${count} items` : "Open cart"}
    >
      <ShoppingBag aria-hidden="true" />
      {hydrated && count > 0 ? (
        <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Button>
  );
}
