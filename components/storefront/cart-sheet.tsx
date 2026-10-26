"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShoppingBag, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { QuantityStepper } from "@/components/shared/quantity-stepper";
import { formatPhp } from "@/lib/money";
import { siteConfig } from "@/lib/config";
import {
  getLineWarning,
  selectCartCount,
  selectCartSubtotal,
  useCartHydrated,
  useCartStore,
} from "@/stores/cart";

export function CartSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const hydrated = useCartHydrated();
  const lines = useCartStore((state) => state.lines);
  const increment = useCartStore((state) => state.increment);
  const decrement = useCartStore((state) => state.decrement);
  const removeLine = useCartStore((state) => state.removeLine);
  const count = useCartStore(selectCartCount);
  const subtotal = useCartStore(selectCartSubtotal);

  const shipping = hydrated
    ? subtotal >= siteConfig.freeShippingThresholdCentavos || subtotal <= 0
      ? 0
      : siteConfig.shippingFlatCentavos
    : 0;
  const blocked = lines.some((line) => line.stock <= 0 || line.quantity > line.stock);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0 p-0" aria-describedby="cart-sheet-description">
        <SheetHeader className="border-b border-white/10 p-6">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="size-5 text-primary" aria-hidden="true" />
            Your cart
            {hydrated && count > 0 ? (
              <span className="text-sm font-normal text-muted-foreground">({count})</span>
            ) : null}
          </SheetTitle>
          <SheetDescription id="cart-sheet-description">
            Review your picks before checkout. Prices and stock are confirmed again on the next step.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {!hydrated ? (
            <div className="space-y-5" aria-label="Loading cart">
              {[0, 1, 2].map((item) => (
                <div key={item} className="flex gap-3">
                  <Skeleton className="size-20 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-8 w-28" />
                  </div>
                </div>
              ))}
            </div>
          ) : lines.length === 0 ? (
            <EmptyState
              title="Your cart is empty."
              description="Explore the collection and add a few favourites. Nothing is reserved until checkout."
              action={
                <Button asChild>
                  <Link href="/products" onClick={() => onOpenChange(false)}>
                    Browse products <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              }
            />
          ) : (
            <ul className="space-y-5">
              {lines.map((line) => {
                const warning = getLineWarning(line);
                return (
                  <li key={line.variantId} className="flex gap-3 border-b border-white/5 pb-5 last:border-0">
                    <Link
                      href={`/products/${line.productSlug}`}
                      onClick={() => onOpenChange(false)}
                      className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-muted"
                    >
                      {line.imageUrl ? (
                        <Image
                          src={line.imageUrl}
                          alt={line.imageAlt}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="grid h-full place-items-center text-muted-foreground">
                          <ShoppingBag className="size-5" aria-hidden="true" />
                        </span>
                      )}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link
                            href={`/products/${line.productSlug}`}
                            onClick={() => onOpenChange(false)}
                            className="block truncate text-sm font-semibold hover:text-primary"
                          >
                            {line.productName}
                          </Link>
                          <p className="truncate text-xs text-muted-foreground">{line.variantLabel}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeLine(line.variantId)}
                          aria-label={`Remove ${line.productName} from cart`}
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 aria-hidden="true" />
                        </Button>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                        <QuantityStepper
                          value={line.quantity}
                          min={1}
                          max={Math.max(line.stock, 1)}
                          onDecrease={() => decrement(line.variantId)}
                          onIncrease={() => increment(line.variantId)}
                          label={`${line.productName} quantity`}
                        />
                        <span className="text-sm font-semibold tabular-nums">
                          {formatPhp(line.unitPriceCentavos * line.quantity)}
                        </span>
                      </div>
                      {warning ? (
                        <p className="mt-2 text-xs font-medium text-amber-300">{warning}</p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {hydrated && lines.length > 0 ? (
          <SheetFooter className="border-t border-white/10 bg-background/40 p-6">
            <div className="mb-2 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold tabular-nums">{formatPhp(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Estimated shipping</span>
                <span className="font-medium tabular-nums">
                  {shipping === 0 ? "Free" : formatPhp(shipping)}
                </span>
              </div>
              {subtotal < siteConfig.freeShippingThresholdCentavos ? (
                <p className="text-xs leading-5 text-muted-foreground">
                  Add {formatPhp(siteConfig.freeShippingThresholdCentavos - subtotal)} more for free
                  shipping.
                </p>
              ) : null}
            </div>
            {blocked ? (
              <p className="mb-2 text-xs text-amber-300" role="status">
                Some quantities exceed current stock. Adjust them before checkout.
              </p>
            ) : null}
            <div className="grid gap-2 sm:grid-cols-2">
              <Button variant="outline" asChild>
                <Link href="/cart" onClick={() => onOpenChange(false)}>
                  View cart
                </Link>
              </Button>
              <Button asChild disabled={blocked}>
                <Link href="/checkout" onClick={() => onOpenChange(false)}>
                  Checkout <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
