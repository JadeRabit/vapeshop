import type { Metadata } from "next";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowRight,
  BadgeDollarSign,
  Boxes,
  CircleDollarSign,
  Clock3,
  Package,
  PackageCheck,
  ShoppingBag,
  ShieldCheck,
  Sparkles,
  Truck,
  XCircle,
} from "lucide-react";
import { requirePageAdmin } from "@/lib/auth-guards";
import { getAdminAnalytics } from "@/lib/data/admin-analytics";
import { getAdminCategories } from "@/lib/data/admin-products";
import { env } from "@/lib/env";
import { MetricCard } from "@/components/admin/metric-card";
import { SalesChart } from "@/components/admin/sales-chart";
import { NewProductButton } from "@/components/admin/new-product-button";
import { EmptyState } from "@/components/shared/empty-state";
import { OrderStatusBadge, PaymentMethodBadge } from "@/components/shared/order-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPhp } from "@/lib/money";
import { cn, formatDateTime, formatLongDate, formatRelativeTime } from "@/lib/utils";
import { siteConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Overview",
  robots: { index: false, follow: false },
};

const pipeline = [
  {
    status: "PENDING",
    label: "Pending",
    icon: Clock3,
    className: "border-amber-300/20 bg-amber-300/[0.04] text-amber-200",
  },
  {
    status: "PAID",
    label: "Paid",
    icon: CircleDollarSign,
    className: "border-emerald-400/20 bg-emerald-400/[0.04] text-emerald-300",
  },
  {
    status: "SHIPPED",
    label: "Shipped",
    icon: Truck,
    className: "border-cyan-300/20 bg-cyan-300/[0.04] text-cyan-200",
  },
  {
    status: "DELIVERED",
    label: "Delivered",
    icon: PackageCheck,
    className: "border-primary/20 bg-primary/[0.04] text-primary",
  },
  {
    status: "CANCELLED",
    label: "Cancelled",
    icon: XCircle,
    className: "border-white/10 bg-white/[0.02] text-muted-foreground",
  },
] as const;

function TodayStat({
  icon: Icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
  tone?: "default" | "warning";
}) {
  return (
    <div className="flex items-start gap-3 p-4 sm:p-5">
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-primary",
          tone === "warning" && "border-amber-300/20 bg-amber-300/[0.07] text-amber-200",
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
        <p className="mt-0.5 text-[11px] leading-5 text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}

export default async function AdminOverviewPage() {
  await requirePageAdmin();
  const [analytics, categories] = await Promise.all([
    getAdminAnalytics(),
    getAdminCategories(),
  ]);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            <Sparkles className="size-3.5" aria-hidden="true" />
            {siteConfig.name}
          </p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatLongDate(new Date())} · Sales, fulfilment, and inventory in Asia/Manila time.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/orders">
              Open order queue <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
          <NewProductButton
            categories={categories}
            cloudinaryEnabled={env.isCloudinaryConfigured}
          />
        </div>
      </header>

      <Card className="grid divide-y divide-white/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
        <TodayStat
          icon={BadgeDollarSign}
          label="Sales today"
          value={formatPhp(analytics.today.salesCentavos)}
          hint="Paid, shipped, and delivered orders placed today."
        />
        <TodayStat
          icon={ShoppingBag}
          label="Orders today"
          value={analytics.today.orders.toLocaleString("en-PH")}
          hint="All non-cancelled orders placed today."
        />
        <TodayStat
          icon={Clock3}
          label="Pending now"
          value={analytics.statusCounts.PENDING.toLocaleString("en-PH")}
          hint="Orders still waiting for payment or fulfilment."
        />
        <TodayStat
          icon={AlertTriangle}
          label="Needs attention"
          value={analytics.attentionCount.toLocaleString("en-PH")}
          hint="Missing GCash proof or pending over 24 hours."
          tone={analytics.attentionCount > 0 ? "warning" : "default"}
        />
      </Card>

      <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total sales"
          value={formatPhp(analytics.totalSalesCentavos)}
          hint="All-time paid, shipped, and delivered orders."
          icon={<BadgeDollarSign className="size-4" aria-hidden="true" />}
          href="/admin/orders?status=PAID"
          trend={{ value: analytics.comparison.revenuePct, label: "30-day revenue" }}
        />
        <MetricCard
          label="Orders"
          value={analytics.totalOrders.toLocaleString("en-PH")}
          hint="All orders except cancelled."
          icon={<ShoppingBag className="size-4" aria-hidden="true" />}
          href="/admin/orders"
          trend={{ value: analytics.comparison.ordersPct, label: "30-day orders" }}
        />
        <MetricCard
          label="Active products"
          value={analytics.activeProducts.toLocaleString("en-PH")}
          hint="Live products with at least one active variant."
          icon={<Package className="size-4" aria-hidden="true" />}
          href="/admin/products?status=published"
        />
        <MetricCard
          label="Low-stock alerts"
          value={analytics.lowStockCount.toLocaleString("en-PH")}
          hint="Active variants at or below their threshold."
          icon={<AlertTriangle className="size-4" aria-hidden="true" />}
          href="/admin/products?lowStock=1"
          tone={analytics.lowStockCount > 0 ? "warning" : "default"}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <Card className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Sales performance</h2>
              <p className="text-xs text-muted-foreground">
                Daily paid revenue, latest {analytics.chartDays} calendar days.
              </p>
            </div>
            <Badge variant="muted">PHP</Badge>
          </div>
          <div className="mt-5">
            <SalesChart data={analytics.dailySales} />
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Order pipeline</h2>
              <p className="text-xs text-muted-foreground">Every order, grouped by stage.</p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/orders">View all</Link>
            </Button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {pipeline.map((stage) => {
              const Icon = stage.icon;
              return (
                <Link
                  key={stage.status}
                  href={`/admin/orders?status=${stage.status}`}
                  className={cn(
                    "rounded-xl border p-3 transition-colors hover:border-primary/30 hover:bg-white/[0.04]",
                    stage.className,
                  )}
                >
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em]">
                    <Icon className="size-3.5" aria-hidden="true" />
                    {stage.label}
                  </span>
                  <span className="mt-1.5 block text-2xl font-semibold tabular-nums text-foreground">
                    {analytics.statusCounts[stage.status].toLocaleString("en-PH")}
                  </span>
                </Link>
              );
            })}
            <Link
              href="/admin/orders"
              className="rounded-xl border border-white/10 bg-white/[0.02] p-3 transition-colors hover:border-primary/30 hover:bg-white/[0.04]"
            >
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                <ShoppingBag className="size-3.5" aria-hidden="true" />
                All orders
              </span>
              <span className="mt-1.5 block text-2xl font-semibold tabular-nums">
                {analytics.statusCounts.ALL.toLocaleString("en-PH")}
              </span>
            </Link>
          </div>

          <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-[11px] leading-5 text-muted-foreground">
            Pending orders include GCash payments waiting for proof and COD orders ready to ship.
          </p>
        </Card>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <AlertTriangle className="size-4 text-amber-200" aria-hidden="true" /> Needs attention
              </h2>
              <p className="text-xs text-muted-foreground">
                Orders that may be stuck or missing payment details.
              </p>
            </div>
            <Badge variant={analytics.attentionCount > 0 ? "warning" : "success"}>
              {analytics.attentionCount} open
            </Badge>
          </div>

          {analytics.attentionOrders.length === 0 ? (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.04] p-4">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-300" aria-hidden="true" />
              <p className="text-sm leading-6 text-muted-foreground">
                Nothing needs attention right now. Every pending order has a payment reference,
                proof on file where required, and is under 24 hours old.
              </p>
            </div>
          ) : (
            <ul className="mt-4 space-y-2">
              {analytics.attentionOrders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/admin/orders/${order.orderNumber}`}
                    className="flex items-start justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-3 transition-colors hover:border-amber-300/25 hover:bg-amber-300/[0.04]"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{order.orderNumber}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {order.contactName} · {formatPhp(order.totalCentavos)} ·{" "}
                        {formatRelativeTime(order.createdAt)}
                      </span>
                    </span>
                    <Badge variant={order.reason === "PROOF" ? "warning" : "destructive"}>
                      {order.reason === "PROOF" ? "Missing proof" : "Aging"}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Boxes className="size-4 text-primary" aria-hidden="true" /> Low stock
              </h2>
              <p className="text-xs text-muted-foreground">
                Replenish before variants sell out.
              </p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/products?lowStock=1">Manage</Link>
            </Button>
          </div>

          {analytics.lowStockItems.length === 0 ? (
            <p className="mt-6 rounded-xl border border-dashed border-white/12 bg-white/[0.02] p-4 text-sm leading-6 text-muted-foreground">
              Nothing is below threshold right now. Active variants are healthy.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {analytics.lowStockItems.map((item) => (
                <li key={item.variantId}>
                  <Link
                    href={`/admin/products?q=${encodeURIComponent(item.sku)}`}
                    className="flex items-start justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-3 transition-colors hover:border-amber-300/25 hover:bg-amber-300/[0.04]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{item.productName}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {item.variantLabel} · {item.sku}
                      </span>
                    </span>
                    <Badge variant={item.stock === 0 ? "destructive" : "warning"}>
                      {item.stock} left
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Showing up to 6 of {analytics.lowStockCount} alerts.
          </p>
        </Card>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_1.55fr]">
        <Card className="min-w-0 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Top products</h2>
              <p className="text-xs text-muted-foreground">Units sold in the last 30 days.</p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/products">Catalogue</Link>
            </Button>
          </div>

          {analytics.topProducts.length === 0 ? (
            <p className="mt-6 rounded-xl border border-dashed border-white/12 bg-white/[0.02] p-4 text-sm leading-6 text-muted-foreground">
              No paid sales in the last 30 days yet. Top sellers will appear here.
            </p>
          ) : (
            <ol className="mt-4 space-y-2">
              {analytics.topProducts.map((product, index) => (
                <li key={product.variantId}>
                  <Link
                    href={`/products/${product.productSlug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-3 transition-colors hover:border-primary/25 hover:bg-white/[0.04]"
                  >
                    <span className="grid size-7 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-[11px] font-bold text-primary tabular-nums">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{product.productName}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {product.variantLabel}
                      </span>
                    </span>
                    <span className="text-right">
                      <span className="block text-sm font-semibold tabular-nums">
                        {product.quantity} sold
                      </span>
                      <span className="block text-[11px] text-muted-foreground tabular-nums">
                        {formatPhp(product.revenueCentavos)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <section aria-labelledby="recent-orders-heading" className="min-w-0">
          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 id="recent-orders-heading" className="text-lg font-semibold">
                  Recent orders
                </h2>
                <p className="text-xs text-muted-foreground">
                  Newest requests across every status.
                </p>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/admin/orders">
                  View all <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </div>

            {analytics.recentOrders.length === 0 ? (
              <div className="mt-5">
                <EmptyState
                  title="No orders yet."
                  description="Orders placed on the storefront will appear here for fulfilment."
                  action={
                    <Button asChild variant="outline">
                      <Link href="/" target="_blank" rel="noreferrer">
                        Visit storefront
                      </Link>
                    </Button>
                  }
                />
              </div>
            ) : (
              <>
                <ul className="mt-4 space-y-2 sm:hidden">
                  {analytics.recentOrders.map((order) => (
                    <li key={order.id}>
                      <Link
                        href={`/admin/orders/${order.orderNumber}`}
                        className="block rounded-xl border border-white/8 bg-white/[0.02] p-3 transition-colors hover:border-primary/25 hover:bg-white/[0.04]"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-primary">
                            {order.orderNumber}
                          </span>
                          <OrderStatusBadge status={order.status} />
                        </div>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {order.customerName} · {formatRelativeTime(order.createdAt)}
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold tabular-nums">
                            {formatPhp(order.totalCentavos)}
                          </span>
                          <PaymentMethodBadge
                            paymentMethod={order.paymentMethod}
                            className="whitespace-nowrap"
                          />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 hidden sm:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead className="hidden md:table-cell">Placed</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead className="hidden lg:table-cell">Payment</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.recentOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>
                            <Link
                              href={`/admin/orders/${order.orderNumber}`}
                              className="whitespace-nowrap font-medium text-primary hover:underline"
                            >
                              {order.orderNumber}
                            </Link>
                            <span className="block text-[11px] text-muted-foreground">
                              {formatRelativeTime(order.createdAt)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="block text-sm">{order.customerName}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {order.contactEmail}
                            </span>
                          </TableCell>
                          <TableCell className="hidden whitespace-nowrap text-xs text-muted-foreground md:table-cell">
                            {formatDateTime(order.createdAt)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap font-medium tabular-nums">
                            {formatPhp(order.totalCentavos)}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <PaymentMethodBadge
                              paymentMethod={order.paymentMethod}
                              className="whitespace-nowrap"
                            />
                          </TableCell>
                          <TableCell>
                            <OrderStatusBadge status={order.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </Card>
        </section>
      </div>
    </div>
  );
}
