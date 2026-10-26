"use client";

import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useCartUI } from "@/components/storefront/cart-ui";
import { useCartStore, type NewCartLine } from "@/stores/cart";

export function AddToCartButton({
  line,
  quantity = 1,
  label = "Add to cart",
  variant,
  size,
  className,
  onAdded,
}: {
  line: NewCartLine;
  quantity?: number;
  label?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
  onAdded?: () => void;
}) {
  const addLine = useCartStore((state) => state.addLine);
  const { openCart } = useCartUI();
  const unavailable = line.stock <= 0;

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      disabled={unavailable}
      onClick={() => {
        addLine(line, quantity);
        toast.success(`${line.productName} added to cart.`);
        openCart();
        onAdded?.();
      }}
    >
      <ShoppingBag aria-hidden="true" />
      {unavailable ? "Out of stock" : label}
    </Button>
  );
}
