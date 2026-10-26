import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight, CheckCircle2, Clock, CreditCard, Landmark, Package, Wallet } from "lucide-react";
import { getSessionUser } from "@/lib/auth-guards";
import { getOrderForUser } from "@/lib/data/account";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OrderStatusTimeline } from "@/components/storefront/order-status-timeline";
import { PaymentProcessing } from "@/components/checkout/payment-processing";
import { formatPhp } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";
import {
  orderStatusLabels,
  paymentMethodLabels,
} from "@/lib/config";

export const metadata: Metadata = {
  title: "Order confirmation",
  robots: { index: false, follow: false },
};

type SuccessPageProps = {
  params: Promise<{ orderNumber: string }>;
};

const statusCopy = {
  PENDING: {
    title: "Order received.",
    icon: Clock,
    body: "We have your order. Keep the order number handy for follow-ups.",
  },
  PAID: {
    title: "Payment confirmed.",
    icon: CheckCircle2,
    body: "Your payment has been verified. We are preparing your order for fulfilment.",
  },
  SHIPPED: {
    title: "On the way.",
    icon: Package,
    body: "Your order has been handed to the courier. Keep your phone reachable.",
  },
  DELIVERED: {
    title: "Delivered.",
    icon: CheckCircle2,
    body: "Your order has been delivered. Thank you for shopping with us.",
  },
  CANCELLED: {
    title: "Order cancelled.",
    icon: Clock,
    body: "This order was cancelled and any reserved stock has been released.",
  },
} as const;

export default async function OrderSuccessPage({ params }: SuccessPageProps) {
  const { orderNumber } = await params;
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/checkout/success/${orderNumber}`)}`);
  }

  const order = await getOrderForUser(orderNumber, sessionUser.id);
  if (!order) notFound();

  const copy = statusCopy[order.status];
  const Icon = copy.icon;
  const paymentIcon =
    order.paymentMethod === "COD" ? Wallet : order.paymentMethod === "GCASH" ? Landmark : CreditCard;
  const PaymentIcon = paymentIcon;

  const paymentMessage =
    order.paymentMethod === "COD"
      ? "Pay the courier in cash on delivery. Please prepare exact change where possible."
      : order.paymentMethod === "GCASH"
        ? order.status === "PENDING"
          ? "We received your GCash receipt and reference. Staff will verify the payment and update this order."
          : "Your GCash payment has been verified."
        : order.status === "PENDING"
          ? "Card payment is being confirmed by Stripe. This page refreshes automatically."
          : "Your card payment has been confirmed by Stripe.";

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="rounded-3xl border border-primary/20 bg-[radial-gradient(circle_at_10%_0%,rgba(196,255,77,.12),transparent_40%)] p-6 sm:p-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <span className="grid size-12 place-items-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
              <Icon className="size-6" aria-hidden="true" />
            </span>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.28em] text-primary">
              Order {order.orderNumber}
            </p>
            <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">{copy.title}</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{copy.body}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge variant={order.status === "CANCELLED" ? "destructive" : "success"}>
                {orderStatusLabels[order.status]}
              </Badge>
              <Badge variant="muted">{paymentMethodLabels[order.paymentMethod]}</Badge>
              <span className="text-xs text-muted-foreground">
                Placed {formatDateTime(order.createdAt)}
              </span>
            </div>
            {order.paymentMethod === "CARD" && order.status === "PENDING" ? (
              <div className="mt-4">
                <PaymentProcessing enabled />
              </div>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/account/orders">Your orders</Link>
            </Button>
            <Button asChild>
              <Link href="/products">
                Keep shopping <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-white/10 bg-card p-5" aria-labelledby="items-heading">
            <h2 id="items-heading" className="text-lg font-semibold">
              Items
            </h2>
            <ul className="mt-4 space-y-3">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-4 border-b border-white/5 pb-3 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      {item.productSlug ? (
                        <Link href={`/products/${item.productSlug}`} className="hover:text-primary">
                          {item.productName}
                        </Link>
                      ) : (
                        item.productName
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.variantLabel} · {item.sku} · Qty {item.quantity}
                    </p>
                  </div>
                  <p className="whitespace-nowrap text-sm font-semibold tabular-nums">
                    {formatPhp(item.lineTotalCentavos)}
                  </p>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-2 border-t border-white/10 pt-4 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="tabular-nums">{formatPhp(order.subtotalCentavos)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd className="tabular-nums">
                  {order.shippingCentavos === 0 ? "Free" : formatPhp(order.shippingCentavos)}
                </dd>
              </div>
              <div className="flex justify-between gap-3 border-t border-white/10 pt-2 text-base font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatPhp(order.totalCentavos)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-white/10 bg-card p-5" aria-labelledby="timeline-heading">
            <h2 id="timeline-heading" className="text-lg font-semibold">
              Order timeline
            </h2>
            <div className="mt-4">
              <OrderStatusTimeline events={order.events} />
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-white/10 bg-card p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <PaymentIcon className="size-4 text-primary" aria-hidden="true" /> Payment
            </h2>
            <p className="mt-2 text-sm font-medium">{paymentMethodLabels[order.paymentMethod]}</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{paymentMessage}</p>
            {order.paymentReference ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Reference: <span className="font-medium text-foreground">{order.paymentReference}</span>
              </p>
            ) : null}
            {order.notes ? (
              <p className="mt-3 rounded-lg border border-white/10 bg-white/[0.02] p-3 text-xs leading-5 text-muted-foreground">
                Note: {order.notes}
              </p>
            ) : null}
          </section>

          <section className="rounded-2xl border border-white/10 bg-card p-5">
            <h2 className="text-base font-semibold">Delivery details</h2>
            <p className="mt-2 text-sm font-medium">{order.contactName}</p>
            <p className="text-xs text-muted-foreground">{order.contactPhone}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {order.shippingAddress.line1}
              {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
              {order.shippingAddress.barangay ? `, ${order.shippingAddress.barangay}` : ""}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.province}{" "}
              {order.shippingAddress.postalCode}
            </p>
            <p className="mt-3 text-xs text-muted-foreground">{order.contactEmail}</p>
          </section>

          <p className="text-xs leading-6 text-muted-foreground">
            Need help? Contact support with order number <strong>{order.orderNumber}</strong>. Valid ID
            may be requested on delivery for age-restricted products.
          </p>
        </aside>
      </div>
    </div>
  );
}
