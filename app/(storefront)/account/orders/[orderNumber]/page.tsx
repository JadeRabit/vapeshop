import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CreditCard,
  Landmark,
  Package,
  Truck,
  Wallet,
} from "lucide-react";
import { requirePageUser } from "@/lib/auth-guards";
import { getOrderForUser } from "@/lib/data/account";
import { Button } from "@/components/ui/button";
import { OrderStatusTimeline } from "@/components/storefront/order-status-timeline";
import { PaymentProcessing } from "@/components/checkout/payment-processing";
import { OrderStatusBadge, PaymentMethodBadge } from "@/components/shared/order-status-badge";
import { formatPhp } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";
import { paymentMethodLabels } from "@/lib/config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order details",
  robots: { index: false, follow: false },
};

type OrderDetailPageProps = {
  params: Promise<{ orderNumber: string }>;
};

const paymentMessages = {
  COD: "Pay the courier in cash on delivery. Please prepare exact change where possible.",
  GCASH: "GCash payments are verified manually by our team after you upload a receipt.",
  CARD: "Card payments are confirmed securely by Stripe. Card details never touch this store.",
} as const;

export default async function AccountOrderDetailPage({ params }: OrderDetailPageProps) {
  const { orderNumber } = await params;
  const user = await requirePageUser();
  const order = await getOrderForUser(orderNumber, user.id);

  if (!order) notFound();

  const PaymentIcon =
    order.paymentMethod === "COD"
      ? Wallet
      : order.paymentMethod === "GCASH"
        ? Landmark
        : CreditCard;

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/account/orders">
            <ArrowLeft aria-hidden="true" /> All orders
          </Link>
        </Button>
      </div>

      <section
        aria-labelledby="order-heading"
        className="rounded-3xl border border-primary/20 bg-[radial-gradient(circle_at_8%_0%,rgba(196,255,77,.1),transparent_45%)] p-6"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
          Order {order.orderNumber}
        </p>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 id="order-heading" className="text-3xl font-semibold">
              {order.status === "CANCELLED"
                ? "Order cancelled."
                : order.status === "DELIVERED"
                  ? "Delivered."
                  : order.status === "SHIPPED"
                    ? "On the way."
                    : order.status === "PAID"
                      ? "Preparing your order."
                      : "Order received."}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Placed {formatDateTime(order.createdAt)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <OrderStatusBadge status={order.status} />
            <PaymentMethodBadge paymentMethod={order.paymentMethod} />
          </div>
        </div>
        {order.paymentMethod === "CARD" && order.status === "PENDING" ? (
          <div className="mt-4">
            <PaymentProcessing enabled />
          </div>
        ) : null}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <section
            aria-labelledby="order-items-heading"
            className="rounded-2xl border border-white/10 bg-card p-5"
          >
            <h3 id="order-items-heading" className="text-lg font-semibold">
              Items
            </h3>
            <ul className="mt-4 space-y-3">
              {order.items.map((item) => (
                <li
                  key={item.id}
                  className="flex justify-between gap-4 border-b border-white/5 pb-3 last:border-0 last:pb-0"
                >
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

          <section
            aria-labelledby="order-timeline-heading"
            className="rounded-2xl border border-white/10 bg-card p-5"
          >
            <h3 id="order-timeline-heading" className="text-lg font-semibold">
              Order timeline
            </h3>
            <div className="mt-4">
              <OrderStatusTimeline events={order.events} />
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section
            aria-labelledby="order-payment-heading"
            className="rounded-2xl border border-white/10 bg-card p-5"
          >
            <h3
              id="order-payment-heading"
              className="flex items-center gap-2 text-base font-semibold"
            >
              <PaymentIcon className="size-4 text-primary" aria-hidden="true" /> Payment
            </h3>
            <p className="mt-2 text-sm font-medium">{paymentMethodLabels[order.paymentMethod]}</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {paymentMessages[order.paymentMethod]}
            </p>
            {order.paymentReference ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Reference:{" "}
                <span className="font-medium text-foreground">{order.paymentReference}</span>
              </p>
            ) : null}
            {order.notes ? (
              <p className="mt-3 rounded-lg border border-white/10 bg-white/[0.02] p-3 text-xs leading-5 text-muted-foreground">
                Note: {order.notes}
              </p>
            ) : null}
          </section>

          <section
            aria-labelledby="order-delivery-heading"
            className="rounded-2xl border border-white/10 bg-card p-5"
          >
            <h3
              id="order-delivery-heading"
              className="flex items-center gap-2 text-base font-semibold"
            >
              <Truck className="size-4 text-primary" aria-hidden="true" /> Delivery
            </h3>
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

          <section className="rounded-2xl border border-white/10 bg-card p-5">
            <h3 className="flex items-center gap-2 text-base font-semibold">
              <Package className="size-4 text-primary" aria-hidden="true" /> Need help?
            </h3>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              Contact support with order number <strong>{order.orderNumber}</strong>. Valid ID may be
              requested on delivery for age-restricted products.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
