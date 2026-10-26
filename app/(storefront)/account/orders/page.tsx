import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, PackageOpen } from "lucide-react";
import { requirePageUser } from "@/lib/auth-guards";
import { getOrderSummaries } from "@/lib/data/account";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { OrderStatusBadge, PaymentMethodBadge } from "@/components/shared/order-status-badge";
import { formatPhp } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Orders",
  robots: { index: false, follow: false },
};

export default async function AccountOrdersPage() {
  const user = await requirePageUser();
  const orders = await getOrderSummaries(user.id);

  return (
    <section aria-labelledby="orders-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="orders-heading" className="text-2xl font-semibold">
            Order history
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Track deliveries, review payment status, and reopen any order.
          </p>
        </div>
        {orders.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            {orders.length} {orders.length === 1 ? "order" : "orders"}
          </p>
        ) : null}
      </div>

      {orders.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<PackageOpen className="size-6" aria-hidden="true" />}
            title="No orders yet."
            description="When you place an order, it will appear here with its live status and payment details."
            action={
              <Button asChild>
                <Link href="/products">Browse products</Link>
              </Button>
            }
          />
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/account/orders/${order.orderNumber}`}
                className="group block rounded-2xl border border-white/10 bg-card p-5 transition-colors hover:border-primary/30 hover:bg-white/[0.03]"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-base font-semibold">{order.orderNumber}</p>
                      <OrderStatusBadge status={order.status} />
                      <PaymentMethodBadge paymentMethod={order.paymentMethod} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Placed {formatDateTime(order.createdAt)} · {order.itemCount}{" "}
                      {order.itemCount === 1 ? "item" : "items"}
                    </p>
                    {order.itemSummary ? (
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                        {order.itemSummary}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-2">
                    <p className="font-semibold tabular-nums">{formatPhp(order.totalCentavos)}</p>
                    <span className="flex items-center gap-1 text-xs font-medium text-primary">
                      View order
                      <ArrowRight
                        className="size-3.5 transition-transform group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
