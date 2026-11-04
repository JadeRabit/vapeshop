import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Clock3,
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
import { CopyButton } from "@/components/admin/copy-button";
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
import { formatDateTime, formatRelativeTime } from "@/lib/utils";

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

  const ageMs = Date.now() - new Date(order.createdAt).getTime();
  const isAging = order.status === "PENDING" && ageMs > 24 * 60 * 60 * 1000;
  const missingProof =
    order.status === "PENDING" &&
    order.paymentMethod === "GCASH" &&
    (!order.paymentReference || !order.hasPaymentProof);
  const needsAttention = isAging || missingProof;

  const addressText = [
    order.shippingAddress.recipientName ?? order.contactName,
    order.shippingAddress.phone ?? order.contactPhone,
    order.shippingAddress.line1,
    order.shippingAddress.line2,
    order.shippingAddress.barangay,
    `${order.shippingAddress.city ?? ""} ${order.shippingAddress.province ?? ""} ${order.shippingAddress.postalCode ?? ""}`.trim(),
    order.shippingAddress.country ?? "PH",
  ]
    .filter(Boolean)
    .join("\n");

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
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                Order {order.orderNumber}
              </p>
              <CopyButton value={order.orderNumber} label="Copy order number" />
            </div>
            <h1 className="mt-2 text-3xl font-semibold">Investigate &amp; fulfil</h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span>Placed {formatDateTime(order.createdAt)}</span>
              <span className="inline-flex items-center gap-1">
                <Clock3 className="size-3.5" aria-hidden="true" />
                {formatRelativeTime(order.createdAt)}
              </span>
              <span>
                {order.items.length} {order.items.length === 1 ? "line" : "lines"}
              </span>
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
            {needsAttention ? <Badge variant="destructive">Needs attention</Badge> : null}
          </div>
        </div>
      </Card>

      {needsAttention ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/[0.05] p-4 text-sm leading-6 text-amber-100">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>
            {missingProof
              ? "This GCash order is missing a payment reference or receipt. Do not verify payment until both are on file."
              : "This pending order has been waiting for more than 24 hours. Review the payment and fulfilment status."}
          </p>
        </div>
      ) : null}

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
                    <TableHead className="hidden sm:table-cell">SKU</TableHead>
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
                      <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">
                        {item.sku}
                      </TableCell>
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

        <aside className="space-y-6 xl:sticky xl:top-20 xl:self-start">
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
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <UserRound className="size-4 text-primary" aria-hidden="true" /> Customer
              </h2>
              <CopyButton value={order.contactEmail} label="Copy customer email" />
            </div>
            <p className="mt-3 text-sm font-medium">{order.contactName}</p>
            <p className="text-xs text-muted-foreground">{order.contactEmail}</p>
            <p className="text-xs text-muted-foreground">{order.contactPhone}</p>
            <p className="mt-3 border-t border-white/10 pt-3 text-xs text-muted-foreground">
              Account: {order.customer.name ?? "Unnamed"} · {order.customer.email}
            </p>
            <Button asChild variant="outline" size="sm" className="mt-3 w-full">
              <Link href={`/admin/orders?q=${encodeURIComponent(order.customer.email)}`}>
                All orders from this customer
              </Link>
            </Button>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <MapPin className="size-4 text-primary" aria-hidden="true" /> Shipping snapshot
              </h2>
              <CopyButton value={addressText} label="Copy shipping address" />
            </div>
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
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <PaymentIcon className="size-4 text-primary" aria-hidden="true" /> Payment
              </h2>
              {order.paymentReference ? (
                <CopyButton value={order.paymentReference} label="Copy payment reference" />
              ) : null}
            </div>
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
