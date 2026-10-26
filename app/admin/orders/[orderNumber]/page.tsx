import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CreditCard,
  ExternalLink,
  Landmark,
  MapPin,
  Package,
  ShieldCheck,
  UserRound,
  Wallet,
} from "lucide-react";
import { requirePageAdmin } from "@/lib/auth-guards";
import { getAdminOrder } from "@/lib/data/admin-orders";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrderStatusBadge, PaymentMethodBadge } from "@/components/shared/order-status-badge";
import { OrderStatusActions } from "@/components/admin/order-status-actions";
import { orderStatusLabels, paymentMethodLabels } from "@/lib/config";
import { formatPhp } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order detail",
  robots: { index: false, follow: false },
};

type AdminOrderDetailPageProps = {
  params: Promise<{ orderNumber: string }>;
};

export default async function AdminOrderDetailPage({ params }: AdminOrderDetailPageProps) {
  await requirePageAdmin();
  const { orderNumber } = await params;
  const order = await getAdminOrder(orderNumber);
  if (!order) notFound();

  const PaymentIcon =
    order.paymentMethod === "COD"
      ? Wallet
      : order.paymentMethod === "GCASH"
        ? Landmark
        : CreditCard;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/admin/orders">
            <ArrowLeft aria-hidden="true" /> Order queue
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/account/orders/${order.orderNumber}`} target="_blank" rel="noreferrer">
            Customer view <ExternalLink aria-hidden="true" />
          </Link>
        </Button>
      </div>

      <Card className="border-primary/20 bg-[radial-gradient(circle_at_8%_0%,rgba(196,255,77,.08),transparent_45%)] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              Order {order.orderNumber}
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Investigate & fulfil</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Placed {formatDateTime(order.createdAt)} · {order.items.length}{" "}
              {order.items.length === 1 ? "line" : "lines"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <OrderStatusBadge status={order.status} />
            <PaymentMethodBadge paymentMethod={order.paymentMethod} />
            {order.paymentMethod === "GCASH" ? (
              <Badge variant={order.hasPaymentProof ? "success" : "warning"}>
                {order.hasPaymentProof ? "Proof on file" : "No proof"}
              </Badge>
            ) : null}
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Package className="size-4 text-primary" aria-hidden="true" /> Items
            </h2>
            <div className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Unit</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Line total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Link
                          href={`/products/${item.productSlug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-medium hover:text-primary"
                        >
                          {item.productName}
                        </Link>
                        <span className="block text-xs text-muted-foreground">
                          {item.variantLabel}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{item.sku}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatPhp(item.unitPriceCentavos)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{item.quantity}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatPhp(item.lineTotalCentavos)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <dl className="ml-auto mt-5 max-w-xs space-y-2 border-t border-white/10 pt-4 text-sm">
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
          </Card>

          <Card className="p-5">
            <h2 className="text-lg font-semibold">Status timeline</h2>
            {order.events.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No events recorded.</p>
            ) : (
              <ol className="mt-4 space-y-0">
                {order.events.map((event, index) => (
                  <li key={event.id} className="relative flex gap-3 pb-5 last:pb-0">
                    {index < order.events.length - 1 ? (
                      <span
                        className="absolute left-[7px] top-4 h-full w-px bg-white/10"
                        aria-hidden="true"
                      />
                    ) : null}
                    <span
                      className={`relative z-10 mt-1 size-3.5 shrink-0 rounded-full border ${
                        event.toStatus === "CANCELLED"
                          ? "border-destructive/40 bg-destructive/30"
                          : "border-primary/40 bg-primary/30"
                      }`}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {event.fromStatus
                          ? `${orderStatusLabels[event.fromStatus as keyof typeof orderStatusLabels] ?? event.fromStatus} → `
                          : "Created → "}
                        {orderStatusLabels[event.toStatus as keyof typeof orderStatusLabels] ??
                          event.toStatus}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDateTime(event.createdAt)}
                        {event.actorName ? ` · ${event.actorName}` : " · System"}
                      </p>
                      {event.note ? (
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">{event.note}</p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        <aside className="space-y-6">
          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <ShieldCheck className="size-4 text-primary" aria-hidden="true" /> Actions
            </h2>
            <div className="mt-3">
              <OrderStatusActions
                orderNumber={order.orderNumber}
                status={order.status}
                paymentMethod={order.paymentMethod}
                paymentReference={order.paymentReference}
                hasPaymentProof={order.hasPaymentProof}
              />
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <UserRound className="size-4 text-primary" aria-hidden="true" /> Customer
            </h2>
            <p className="mt-3 text-sm font-medium">{order.contactName}</p>
            <p className="text-xs text-muted-foreground">{order.contactEmail}</p>
            <p className="text-xs text-muted-foreground">{order.contactPhone}</p>
            <p className="mt-3 border-t border-white/10 pt-3 text-xs text-muted-foreground">
              Account: {order.customer.name ?? "Unnamed"} · {order.customer.email}
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <MapPin className="size-4 text-primary" aria-hidden="true" /> Shipping snapshot
            </h2>
            <p className="mt-3 text-sm font-medium">
              {order.shippingAddress.recipientName ?? order.contactName}
            </p>
            <p className="text-xs text-muted-foreground">
              {order.shippingAddress.phone ?? order.contactPhone}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {order.shippingAddress.line1}
              {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
              {order.shippingAddress.barangay ? `, ${order.shippingAddress.barangay}` : ""}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.province}{" "}
              {order.shippingAddress.postalCode}
              <br />
              {order.shippingAddress.country ?? "PH"}
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <PaymentIcon className="size-4 text-primary" aria-hidden="true" /> Payment
            </h2>
            <p className="mt-3 text-sm font-medium">{paymentMethodLabels[order.paymentMethod]}</p>
            {order.paymentReference ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Reference:{" "}
                <span className="font-medium text-foreground">{order.paymentReference}</span>
              </p>
            ) : null}

            {order.paymentMethod === "GCASH" ? (
              <div className="mt-3 border-t border-white/10 pt-3">
                {order.hasPaymentProof ? (
                  <>
                    <Button asChild variant="outline" size="sm">
                      <a
                        href={`/api/admin/payment-proof/${order.id}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View GCash receipt <ExternalLink aria-hidden="true" />
                      </a>
                    </Button>
                    <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
                      Opens a short-lived private link. Uploaded{" "}
                      {order.proofUploadedAt ? formatDateTime(order.proofUploadedAt) : "recently"}.
                    </p>
                  </>
                ) : (
                  <p className="text-xs leading-5 text-amber-200">
                    No receipt is attached. Do not verify payment until the receipt and reference
                    are on file.
                  </p>
                )}
              </div>
            ) : null}

            {order.paymentMethod === "CARD" ? (
              <p className="mt-3 border-t border-white/10 pt-3 text-xs leading-5 text-muted-foreground">
                Card details never reach this store. Stripe confirms payment through its signed
                webhook.
              </p>
            ) : null}

            {order.notes ? (
              <p className="mt-3 rounded-lg border border-white/10 bg-white/[0.02] p-3 text-xs leading-5 text-muted-foreground">
                Customer note: {order.notes}
              </p>
            ) : null}
          </Card>
        </aside>
      </div>
    </div>
  );
}
