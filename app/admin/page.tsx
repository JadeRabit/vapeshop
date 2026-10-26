import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BadgeDollarSign,
  Boxes,
  Package,
  ShoppingBag,
} from "lucide-react";
import { requirePageAdmin } from "@/lib/auth-guards";
import { getAdminAnalytics } from "@/lib/data/admin-analytics";
import { MetricCard } from "@/components/admin/metric-card";
import { SalesChart } from "@/components/admin/sales-chart";
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
import { formatDateTime } from "@/lib/utils";
import { siteConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Overview",
  robots: { index: false, follow: false },
};

export default async function AdminOverviewPage() {
  await requirePageAdmin();
  const analytics = await getAdminAnalytics();

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            {siteConfig.name}
          </p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sales, fulfilment, and inventory in Asia/Manila time.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/orders">
            Open order queue <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </header>

      <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total sales"
          value={formatPhp(analytics.totalSalesCentavos)}
          hint="All-time paid, shipped, and delivered orders."
          icon={<BadgeDollarSign className="size-4" aria-hidden="true" />}
          href="/admin/orders?status=PAID"
        />
        <MetricCard
          label="Orders"
          value={analytics.totalOrders.toLocaleString("en-PH")}
          hint="All orders except cancelled."
          icon={<ShoppingBag className="size-4" aria-hidden="true" />}
          href="/admin/orders"
        />
        <MetricCard
          label="Active products"
          value={analytics.activeProducts.toLocaleString("en-PH")}
          hint="Live products with at least one active variant."
          icon={<Package className="size-4" aria-hidden="true" />}
          href="/admin/products"
        />
        <MetricCard
          label="Low-stock alerts"
          value={analytics.lowStockCount.toLocaleString("en-PH")}
          hint="Active variants at or below their threshold."
          icon={<AlertTriangle className="size-4" aria-hidden="true" />}
          href="/admin/products"
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
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Boxes className="size-4 text-primary" aria-hidden="true" /> Low stock
              </h2>
              <p className="text-xs text-muted-foreground">
                Replenish before variants sell out.
              </p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/products">Manage</Link>
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

      <section aria-labelledby="recent-orders-heading">
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
            <div className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Placed</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Link
                          href={`/admin/orders/${order.orderNumber}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {order.orderNumber}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span className="block text-sm">{order.customerName}</span>
                        <span className="block text-xs text-muted-foreground">
                          {order.contactEmail}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatDateTime(order.createdAt)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-medium tabular-nums">
                        {formatPhp(order.totalCentavos)}
                      </TableCell>
                      <TableCell>
                        <PaymentMethodBadge paymentMethod={order.paymentMethod} />
                      </TableCell>
                      <TableCell>
                        <OrderStatusBadge status={order.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
