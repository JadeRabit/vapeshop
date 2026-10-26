"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, LockKeyhole, ShoppingBag, Trash2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { QuantityStepper } from "@/components/shared/quantity-stepper";
import { calculateShipping } from "@/lib/money";
import { formatPhp } from "@/lib/money";
import { siteConfig } from "@/lib/config";
import {
  getLineWarning,
  selectCartCount,
  selectCartSubtotal,
  useCartHydrated,
  useCartStore,
} from "@/stores/cart";

export function CartPage({ isAuthenticated }: { isAuthenticated: boolean }) {
  const hydrated = useCartHydrated();
  const lines = useCartStore((state) => state.lines);
  const increment = useCartStore((state) => state.increment);
  const decrement = useCartStore((state) => state.decrement);
  const removeLine = useCartStore((state) => state.removeLine);
  const clearCart = useCartStore((state) => state.clearCart);
  const count = useCartStore(selectCartCount);
  const subtotal = useCartStore(selectCartSubtotal);

  const shipping = calculateShipping(
    subtotal,
    siteConfig.freeShippingThresholdCentavos,
    siteConfig.shippingFlatCentavos,
  );
  const blocked = lines.some((line) => line.stock <= 0 || line.quantity > line.stock);
  const checkoutHref = isAuthenticated
    ? "/checkout"
    : `/login?callbackUrl=${encodeURIComponent("/checkout")}`;

  if (!hydrated) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Skeleton className="h-10 w-52" />
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">Almost there</p>
          <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">Your cart</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {count > 0 ? `${count} item${count === 1 ? "" : "s"} in your bag` : "Nothing in your bag yet"}
          </p>
        </div>
        {lines.length > 0 ? (
          <Button type="button" variant="ghost" size="sm" onClick={clearCart}>
            Clear cart
          </Button>
        ) : null}
      </div>

      {lines.length === 0 ? (
        <EmptyState
          className="mt-10"
          title="Your cart is empty."
          description="Start with a pod kit or explore this week's featured flavours. Your cart is saved on this device."
          icon={<ShoppingBag className="size-6" aria-hidden="true" />}
          action={
            <Button asChild>
              <Link href="/products">
                Browse products <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_380px]">
          <ul className="space-y-3">
            {lines.map((line) => {
              const warning = getLineWarning(line);
              return (
                <li
                  key={line.variantId}
                  className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-card p-4 sm:flex-row"
                >
                  <Link
                    href={`/products/${line.productSlug}`}
                    className="relative aspect-square w-full shrink-0 overflow-hidden rounded-xl border border-white/10 bg-muted sm:size-28"
                  >
                    {line.imageUrl ? (
                      <Image
                        src={line.imageUrl}
                        alt={line.imageAlt}
                        fill
                        sizes="(min-width: 640px) 112px, 100vw"
                        className="object-cover"
                      />
                    ) : (
                      <span className="grid h-full place-items-center text-muted-foreground">
                        <ShoppingBag className="size-5" aria-hidden="true" />
                      </span>
                    )}
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={`/products/${line.productSlug}`}
                          className="text-base font-semibold hover:text-primary"
                        >
                          {line.productName}
                        </Link>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {line.variantLabel} · {line.sku}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatPhp(line.unitPriceCentavos)} each
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeLine(line.variantId)}
                        aria-label={`Remove ${line.productName}`}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </div>

                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
                      <QuantityStepper
                        value={line.quantity}
                        min={1}
                        max={Math.max(line.stock, 1)}
                        onDecrease={() => decrement(line.variantId)}
                        onIncrease={() => increment(line.variantId)}
                        label={`${line.productName} quantity`}
                      />
                      <span className="text-base font-semibold tabular-nums">
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

          <aside className="rounded-2xl border border-white/10 bg-card p-6 lg:sticky lg:top-24">
            <h2 className="text-lg font-semibold">Order summary</h2>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-medium tabular-nums">{formatPhp(subtotal)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd className="font-medium tabular-nums">
                  {shipping === 0 ? "Free" : formatPhp(shipping)}
                </dd>
              </div>
              <div className="flex justify-between gap-3 border-t border-white/10 pt-3 text-base">
                <dt className="font-semibold">Total</dt>
                <dd className="font-semibold tabular-nums">{formatPhp(subtotal + shipping)}</dd>
              </div>
            </dl>

            {subtotal < siteConfig.freeShippingThresholdCentavos ? (
              <p className="mt-4 flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs leading-5 text-muted-foreground">
                <Truck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                Add {formatPhp(siteConfig.freeShippingThresholdCentavos - subtotal)} more to unlock
                free shipping.
              </p>
            ) : null}

            {blocked ? (
              <p className="mt-4 text-xs leading-5 text-amber-300" role="status">
                Some quantities exceed current stock. Adjust the highlighted lines before checkout.
              </p>
            ) : null}

            <Button asChild size="lg" className="mt-5 w-full" disabled={blocked}>
              <Link href={checkoutHref}>
                {isAuthenticated ? "Continue to checkout" : "Sign in to checkout"}
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>

            <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-muted-foreground">
              <LockKeyhole className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
              Prices and stock are confirmed again on the server. No payment data is stored on this
              site.
            </p>

            <Button asChild variant="ghost" className="mt-2 w-full">
              <Link href="/products">Continue shopping</Link>
            </Button>
          </aside>
        </div>
      )}
    </div>
  );
}
