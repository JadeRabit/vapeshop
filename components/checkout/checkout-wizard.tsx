"use client";

import { useEffect, useRef, useState, useTransition, useActionState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  Landmark,
  Loader2,
  LockKeyhole,
  MapPin,
  PackageCheck,
  Plus,
  Truck,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EmptyState } from "@/components/shared/empty-state";
import { AddressForm } from "@/components/account/address-form";
import { PaymentProofUpload } from "@/components/checkout/payment-proof-upload";
import { getCheckoutQuoteAction, placeOrderAction } from "@/lib/actions/checkout";
import { initialCheckoutState, type CheckoutActionState } from "@/lib/action-result";
import type { AddressDTO } from "@/lib/data/account";
import type { CheckoutQuoteResult } from "@/lib/checkout-types";
import { getLineWarning, useCartHydrated, useCartStore } from "@/stores/cart";
import { formatPhp } from "@/lib/money";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Delivery" },
  { id: 2, label: "Payment" },
  { id: 3, label: "Review" },
] as const;

type PaymentMethod = "COD" | "GCASH" | "CARD";

export function CheckoutWizard({
  user,
  addresses,
  cloudinaryEnabled,
  stripeEnabled,
}: {
  user: { name: string | null; email: string };
  addresses: AddressDTO[];
  cloudinaryEnabled: boolean;
  stripeEnabled: boolean;
}) {
  const router = useRouter();
  const hydrated = useCartHydrated();
  const lines = useCartStore((state) => state.lines);
  const clearCart = useCartStore((state) => state.clearCart);

  const defaultAddress = addresses.find((address) => address.isDefault) ?? addresses[0];
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedAddressId, setSelectedAddressId] = useState(defaultAddress?.id ?? "");
  const [addingAddress, setAddingAddress] = useState(addresses.length === 0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
  const [gcashReference, setGcashReference] = useState("");
  const [proofMediaId, setProofMediaId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [quote, setQuote] = useState<CheckoutQuoteResult | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteLoading, startQuoteTransition] = useTransition();
  const [state, formAction, orderPending] = useActionState<CheckoutActionState, FormData>(
    placeOrderAction,
    initialCheckoutState,
  );
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const completedRef = useRef(false);

  const selectedAddress = addresses.find((address) => address.id === selectedAddressId);
  const cartSignature = lines
    .map((line) => `${line.variantId}:${line.quantity}:${line.unitPriceCentavos}`)
    .join("|");

  useEffect(() => {
    if (!addresses.length) {
      setAddingAddress(true);
      return;
    }
    if (!selectedAddressId || !addresses.some((address) => address.id === selectedAddressId)) {
      setSelectedAddressId((addresses.find((address) => address.isDefault) ?? addresses[0]).id);
    }
  }, [addresses, selectedAddressId]);

  useEffect(() => {
    if (step !== 3 || !hydrated || lines.length === 0) return;
    setQuoteError(null);
    startQuoteTransition(async () => {
      const result = await getCheckoutQuoteAction({
        lines: lines.map((line) => ({ variantId: line.variantId, quantity: line.quantity })),
      });
      setQuote(result);
      if (!result.ok) setQuoteError(result.message ?? "Could not refresh your cart.");
    });
  }, [step, cartSignature, hydrated, lines]);

  useEffect(() => {
    if (state.ok || !state.rotateKey) return;
    // A cancelled attempt releases its stock and cannot be reused. Rotate the
    // key so a clean retry creates a new order instead of colliding.
    setIdempotencyKey(crypto.randomUUID());
  }, [state]);

  useEffect(() => {
    if (!state.ok || completedRef.current) return;
    completedRef.current = true;
    clearCart();
    if (state.checkoutUrl) {
      window.location.assign(state.checkoutUrl);
      return;
    }
    if (state.orderNumber) {
      router.push(`/checkout/success/${state.orderNumber}`);
      router.refresh();
    }
  }, [state, clearCart, router]);

  if (!hydrated) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <Skeleton className="h-10 w-56" />
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <Skeleton className="h-96" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          title="Your cart is empty."
          description="Add a product before starting checkout. Your cart is saved on this device."
          action={
            <Button asChild>
              <Link href="/products">Browse products</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const priceChanged =
    quote?.ok &&
    quote.lines?.some((line) => {
      const cartLine = lines.find((item) => item.variantId === line.variantId);
      return cartLine ? cartLine.unitPriceCentavos !== line.unitPriceCentavos : true;
    });

  const gcashReady =
    paymentMethod !== "GCASH" || (gcashReference.trim().length >= 6 && Boolean(proofMediaId));
  const canContinuePayment = gcashReady && (paymentMethod !== "CARD" || stripeEnabled);
  const checkoutBlocked = Boolean(quote?.hasIssues || priceChanged || !quote?.ok);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
            Secure checkout
          </p>
          <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">Finish your order</h1>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/cart">
            <ArrowLeft aria-hidden="true" /> Back to cart
          </Link>
        </Button>
      </div>

      <ol className="mt-8 grid grid-cols-3 gap-2" aria-label="Checkout steps">
        {STEPS.map((item) => (
          <li key={item.id} className="flex flex-col gap-2">
            <span
              className={cn("h-1 rounded-full", step >= item.id ? "bg-primary" : "bg-white/10")}
              aria-hidden="true"
            />
            <span
              className={cn(
                "flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em]",
                step >= item.id ? "text-primary" : "text-muted-foreground",
              )}
              aria-current={step === item.id ? "step" : undefined}
            >
              <span
                className={cn(
                  "grid size-5 place-items-center rounded-full border text-[10px]",
                  step > item.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : step === item.id
                      ? "border-primary text-primary"
                      : "border-white/15 text-muted-foreground",
                )}
              >
                {step > item.id ? <Check className="size-3" aria-hidden="true" /> : item.id}
              </span>
              {item.label}
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border border-white/10 bg-card p-5 sm:p-6">
          {step === 1 ? (
            <section aria-labelledby="delivery-heading" className="space-y-5">
              <div>
                <h2 id="delivery-heading" className="text-xl font-semibold">
                  Delivery address
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose where the courier should deliver. Contact email: {user.email}
                </p>
              </div>

              {addresses.length > 0 ? (
                <RadioGroup
                  value={selectedAddressId}
                  onValueChange={setSelectedAddressId}
                  className="gap-3"
                  aria-label="Saved delivery addresses"
                >
                  {addresses.map((address) => (
                    <label
                      key={address.id}
                      className={cn(
                        "flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors",
                        selectedAddressId === address.id
                          ? "border-primary bg-primary/[0.05]"
                          : "border-white/12 hover:border-white/25",
                      )}
                    >
                      <RadioGroupItem
                        value={address.id}
                        id={`address-${address.id}`}
                        className="mt-1"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                          {address.recipientName}
                          {address.isDefault ? <Badge variant="muted">Default</Badge> : null}
                          {address.label ? (
                            <span className="text-xs font-normal text-muted-foreground">
                              {address.label}
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                          {address.line1}
                          {address.line2 ? `, ${address.line2}` : ""}
                          {address.barangay ? `, ${address.barangay}` : ""}, {address.city},{" "}
                          {address.province} {address.postalCode}
                        </span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {address.phone}
                        </span>
                      </span>
                    </label>
                  ))}
                </RadioGroup>
              ) : (
                <p className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-muted-foreground">
                  Add a delivery address to continue.
                </p>
              )}

              {!addingAddress ? (
                <Button type="button" variant="outline" onClick={() => setAddingAddress(true)}>
                  <Plus aria-hidden="true" /> Add a new address
                </Button>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold">New delivery address</h3>
                    {addresses.length > 0 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setAddingAddress(false)}
                      >
                        Cancel
                      </Button>
                    ) : null}
                  </div>
                  <AddressForm
                    compact
                    submitLabel="Save and use this address"
                    onSaved={(addressId) => {
                      setSelectedAddressId(addressId);
                      setAddingAddress(false);
                      router.refresh();
                    }}
                  />
                </div>
              )}

              <div className="flex justify-end border-t border-white/10 pt-5">
                <Button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!selectedAddress || addingAddress}
                >
                  Continue to payment <ArrowRight aria-hidden="true" />
                </Button>
              </div>
            </section>
          ) : null}

          {step === 2 ? (
            <section aria-labelledby="payment-heading" className="space-y-5">
              <div>
                <h2 id="payment-heading" className="text-xl font-semibold">
                  Payment method
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  COD and GCash are settled locally. Card payments use Stripe-hosted checkout.
                </p>
              </div>

              <RadioGroup
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                className="gap-3"
                aria-label="Payment method"
              >
                <label
                  className={cn(
                    "flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors",
                    paymentMethod === "COD"
                      ? "border-primary bg-primary/[0.05]"
                      : "border-white/12",
                  )}
                >
                  <RadioGroupItem value="COD" id="payment-cod" className="mt-1" />
                  <span className="flex-1">
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <Wallet className="size-4 text-primary" aria-hidden="true" /> Cash on Delivery
                      <Badge variant="muted">Recommended</Badge>
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                      Pay the courier in cash. Stock is reserved when the order is placed.
                    </span>
                  </span>
                </label>

                <label
                  className={cn(
                    "flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors",
                    paymentMethod === "GCASH"
                      ? "border-primary bg-primary/[0.05]"
                      : "border-white/12",
                  )}
                >
                  <RadioGroupItem value="GCASH" id="payment-gcash" className="mt-1" />
                  <span className="flex-1">
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <Landmark className="size-4 text-primary" aria-hidden="true" /> GCash
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                      Send payment, then upload the receipt and reference. Staff verify manually.
                    </span>
                  </span>
                </label>

                {stripeEnabled ? (
                  <label
                    className={cn(
                      "flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors",
                      paymentMethod === "CARD"
                        ? "border-primary bg-primary/[0.05]"
                        : "border-white/12",
                    )}
                  >
                    <RadioGroupItem value="CARD" id="payment-card" className="mt-1" />
                    <span className="flex-1">
                      <span className="flex items-center gap-2 text-sm font-semibold">
                        <CreditCard className="size-4 text-primary" aria-hidden="true" /> Card via
                        Stripe
                      </span>
                      <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                        You will be redirected to Stripe&apos;s secure checkout. Card details never
                        touch this store.
                      </span>
                    </span>
                  </label>
                ) : null}
              </RadioGroup>

              {paymentMethod === "GCASH" ? (
                <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="space-y-2">
                    <Label htmlFor="gcash-reference">GCash reference number</Label>
                    <Input
                      id="gcash-reference"
                      value={gcashReference}
                      onChange={(event) => setGcashReference(event.target.value.toUpperCase())}
                      maxLength={40}
                      placeholder="e.g. 1234567890"
                      autoComplete="off"
                    />
                    <p className="text-xs text-muted-foreground">
                      Use the exact reference shown in your GCash receipt. It cannot be reused.
                    </p>
                  </div>
                  <PaymentProofUpload
                    enabled={cloudinaryEnabled}
                    onUploaded={(mediaId) => setProofMediaId(mediaId)}
                  />
                </div>
              ) : null}

              {paymentMethod === "CARD" ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-sm leading-6 text-muted-foreground">
                  After placing the order you will be redirected to Stripe. The order remains
                  pending until the signed payment webhook confirms it.
                </div>
              ) : null}

              <div className="flex flex-wrap justify-between gap-3 border-t border-white/10 pt-5">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft aria-hidden="true" /> Back
                </Button>
                <Button type="button" onClick={() => setStep(3)} disabled={!canContinuePayment}>
                  Review order <ArrowRight aria-hidden="true" />
                </Button>
              </div>
            </section>
          ) : null}

          {step === 3 ? (
            <form action={formAction} className="space-y-5">
              <input type="hidden" name="addressId" value={selectedAddressId} />
              <input type="hidden" name="paymentMethod" value={paymentMethod} />
              <input type="hidden" name="gcashReference" value={gcashReference} />
              <input type="hidden" name="paymentProofMediaId" value={proofMediaId ?? ""} />
              <input type="hidden" name="notes" value={notes} />
              <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
              <input
                type="hidden"
                name="lines"
                value={JSON.stringify(
                  lines.map((line) => ({ variantId: line.variantId, quantity: line.quantity })),
                )}
              />

              <div>
                <h2 className="text-xl font-semibold">Review and place order</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  We rechecked prices and stock for this order just now.
                </p>
              </div>

              {state.message && !state.ok ? (
                <Alert variant="destructive">
                  <AlertCircle aria-hidden="true" />
                  <AlertDescription>{state.message}</AlertDescription>
                </Alert>
              ) : null}
              {quoteError ? (
                <Alert variant="destructive">
                  <AlertCircle aria-hidden="true" />
                  <AlertDescription>{quoteError}</AlertDescription>
                </Alert>
              ) : null}
              {priceChanged ? (
                <Alert variant="warning">
                  <AlertCircle aria-hidden="true" />
                  <AlertDescription>
                    A price changed while you were checking out. Review the updated total before
                    placing the order.
                  </AlertDescription>
                </Alert>
              ) : null}
              {quote?.hasIssues ? (
                <Alert variant="warning">
                  <AlertCircle aria-hidden="true" />
                  <AlertDescription>
                    Some quantities exceed current stock. Adjust your cart before placing the order.
                  </AlertDescription>
                </Alert>
              ) : null}

              <div className="space-y-3">
                {quoteLoading || !quote?.ok ? (
                  <div className="space-y-3" aria-label="Refreshing order">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : (
                  quote.lines?.map((line) => (
                    <div
                      key={line.variantId}
                      className="flex gap-3 rounded-xl border border-white/8 p-3"
                    >
                      <span className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-muted">
                        {line.imageUrl ? (
                          <Image
                            src={line.imageUrl}
                            alt={line.imageAlt}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        ) : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">
                          {line.productName}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {line.variantLabel} · Qty {line.quantity}
                        </span>
                        {line.issue ? (
                          <span className="mt-1 block text-xs text-amber-300">{line.issue}</span>
                        ) : null}
                      </span>
                      <span className="text-sm font-semibold tabular-nums">
                        {formatPhp(line.lineTotalCentavos)}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="order-notes">Order notes (optional)</Label>
                <Input
                  id="order-notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  maxLength={500}
                  placeholder="Gate code, delivery preference…"
                />
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm">
                <p className="font-semibold">Delivering to</p>
                {selectedAddress ? (
                  <p className="mt-1 leading-6 text-muted-foreground">
                    {selectedAddress.recipientName} · {selectedAddress.phone}
                    <br />
                    {selectedAddress.line1}
                    {selectedAddress.line2 ? `, ${selectedAddress.line2}` : ""}
                    {selectedAddress.barangay ? `, ${selectedAddress.barangay}` : ""},{" "}
                    {selectedAddress.city}, {selectedAddress.province} {selectedAddress.postalCode}
                  </p>
                ) : (
                  <p className="mt-1 text-destructive">
                    Select an address before placing the order.
                  </p>
                )}
                <p className="mt-3 font-semibold">Payment</p>
                <p className="mt-1 text-muted-foreground">
                  {paymentMethod === "COD"
                    ? "Cash on Delivery"
                    : paymentMethod === "GCASH"
                      ? `GCash · ${gcashReference}`
                      : "Card via Stripe"}
                </p>
              </div>

              <div className="flex flex-wrap justify-between gap-3 border-t border-white/10 pt-5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(2)}
                  disabled={orderPending}
                >
                  <ArrowLeft aria-hidden="true" /> Back
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  disabled={
                    orderPending ||
                    quoteLoading ||
                    !quote?.ok ||
                    checkoutBlocked ||
                    !selectedAddress ||
                    !canContinuePayment
                  }
                >
                  {orderPending ? (
                    <>
                      <Loader2 className="animate-spin" aria-hidden="true" /> Placing order…
                    </>
                  ) : (
                    <>
                      <LockKeyhole aria-hidden="true" />
                      {paymentMethod === "CARD" ? "Continue to payment" : "Place order"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          ) : null}
        </div>

        <aside className="rounded-2xl border border-white/10 bg-card p-5 lg:sticky lg:top-24">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <PackageCheck className="size-4 text-primary" aria-hidden="true" /> Order summary
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {lines.map((line) => {
              const warning = getLineWarning(line);
              return (
                <li key={line.variantId} className="flex justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{line.productName}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {line.variantLabel} × {line.quantity}
                    </span>
                    {warning ? <span className="text-xs text-amber-300">{warning}</span> : null}
                  </span>
                  <span className="whitespace-nowrap tabular-nums">
                    {formatPhp(line.unitPriceCentavos * line.quantity)}
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="mt-5 space-y-2 border-t border-white/10 pt-4 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium tabular-nums">
                {formatPhp(
                  quote?.ok
                    ? (quote.subtotalCentavos ?? 0)
                    : lines.reduce((sum, line) => sum + line.unitPriceCentavos * line.quantity, 0),
                )}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Shipping</span>
              <span className="font-medium tabular-nums">
                {quote?.ok
                  ? quote.shippingCentavos === 0
                    ? "Free"
                    : formatPhp(quote.shippingCentavos ?? 0)
                  : "Calculated next"}
              </span>
            </div>
            <div className="flex justify-between gap-3 border-t border-white/10 pt-3 text-base font-semibold">
              <span>Total</span>
              <span className="tabular-nums">
                {quote?.ok
                  ? formatPhp(quote.totalCentavos ?? 0)
                  : formatPhp(
                      lines.reduce((sum, line) => sum + line.unitPriceCentavos * line.quantity, 0),
                    )}
              </span>
            </div>
          </div>
          <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-muted-foreground">
            <Truck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            Flat ₱99 shipping · free over ₱2,500. 21+ ID may be requested on delivery.
          </p>
          <p className="mt-2 flex items-start gap-2 text-xs leading-5 text-muted-foreground">
            <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            Prices are VAT-inclusive. Stock is reserved only after the order is accepted.
          </p>
        </aside>
      </div>
    </div>
  );
}
