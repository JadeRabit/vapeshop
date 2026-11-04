import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Search } from "lucide-react";
import { requirePageAdmin } from "@/lib/auth-guards";
import { getAdminOrderList } from "@/lib/data/admin-orders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { OrderStatusBadge, PaymentMethodBadge } from "@/components/shared/order-status-badge";
import { orderStatuses, orderStatusLabels } from "@/lib/config";
import { formatPhp } from "@/lib/money";
import { cn, formatDateTime, formatRelativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Orders",
  robots: { index: false, follow: false },
};

type AdminOrdersPageProps = {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
};

function ordersHref({
  status,
  q,
  page,
}: {
  status?: string;
  q?: string;
  page?: number;
}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (status && status !== "ALL") params.set("status", status);
  if (page && page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/admin/orders?${query}` : "/admin/orders";
}

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  await requirePageAdmin();
  const params = await searchParams;
  const search = params.q?.trim() ?? "";
  const requestedStatus = params.status ?? "";
  const page = Number.parseInt(params.page ?? "1", 10);

  const result = await getAdminOrderList({
    search,
    status: requestedStatus,
    page: Number.isFinite(page) ? page : 1,
  });

  const hasFilters = Boolean(search) || result.status !== "ALL";

  const tabs = [
    { value: "ALL", label: "All orders", count: result.statusCounts.ALL },
    ...orderStatuses.map((status) => ({
      value: status,
      label: orderStatusLabels[status],
      count: result.statusCounts[status],
    })),
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            Fulfilment
          </p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Orders</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Investigate payments, verify GCash receipts, and move fulfilment forward safely.
          </p>
        </div>
        <p className="rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{result.statusCounts.ALL}</span> total
          orders
        </p>
      </header>

      {result.attentionCount > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/[0.05] px-4 py-3">
          <p className="flex items-center gap-2 text-sm leading-6 text-amber-100">
            <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
            <span>
              <span className="font-semibold">{result.attentionCount}</span> pending order
              {result.attentionCount === 1 ? "" : "s"} need attention — missing GCash proof or
              older than 24 hours.
            </span>
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href={ordersHref({ status: "PENDING", q: search || undefined })}>
              Review pending <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      ) : null}

      <nav aria-label="Order status filters" className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const active = result.status === tab.value;
          return (
            <Link
              key={tab.value}
              href={ordersHref({ status: tab.value, q: search || undefined })}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors",
                active
                  ? "border-primary/35 bg-primary/[0.08] text-primary"
                  : "border-white/10 bg-white/[0.02] text-muted-foreground hover:border-white/20 hover:text-foreground",
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
                  active
                    ? "bg-primary/15 text-primary"
                    : "bg-white/[0.06] text-muted-foreground",
                )}
              >
                {tab.count}
              </span>
            </Link>
          );
        })}
      </nav>

      <Card className="p-4">
        <form method="get" className="flex flex-wrap items-end gap-2">
          {result.status !== "ALL" ? (
            <input type="hidden" name="status" value={result.status} />
          ) : null}
          <div className="min-w-[220px] flex-1">
            <label
              htmlFor="order-search"
              className="mb-1.5 block text-xs font-medium text-muted-foreground"
            >
              Search order number, customer name, or email
            </label>
            <Input
              id="order-search"
              name="q"
              type="search"
              defaultValue={search}
              placeholder="VD-… or customer@email.com"
            />
          </div>
          <Button type="submit" variant="outline">
            <Search aria-hidden="true" /> Search
          </Button>
          {hasFilters ? (
            <Button asChild variant="ghost">
              <Link href="/admin/orders">Clear</Link>
            </Button>
          ) : null}
        </form>
      </Card>

      {result.orders.length === 0 ? (
        <EmptyState
          title={hasFilters ? "No orders matched." : "No orders yet."}
          description={
            hasFilters
              ? "Try a different search term or status filter, or clear the filters."
              : "New storefront orders will appear here with payment and fulfilment context."
          }
          action={
            hasFilters ? (
              <Button asChild variant="outline">
                <Link href="/admin/orders">Clear filters</Link>
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link href="/" target="_blank" rel="noreferrer">
                  Visit storefront
                </Link>
              </Button>
            )
          }
        />
      ) : (
        <Card className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden md:table-cell">Placed</TableHead>
                <TableHead className="hidden md:table-cell">Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="hidden sm:table-cell">Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Link
                        href={`/admin/orders/${order.orderNumber}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                      {order.attentionReason ? (
                        <Badge
                          variant={order.attentionReason === "PROOF" ? "warning" : "destructive"}
                        >
                          {order.attentionReason === "PROOF" ? "Needs proof" : "Aging"}
                        </Badge>
                      ) : null}
                    </div>
                    <span className="block text-[11px] text-muted-foreground">
                      {formatRelativeTime(order.createdAt)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="block text-sm">{order.contactName}</span>
                    <span className="block text-xs text-muted-foreground">{order.contactEmail}</span>
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap text-xs text-muted-foreground md:table-cell">
                    {formatDateTime(order.createdAt)}
                  </TableCell>
                  <TableCell className="hidden text-sm tabular-nums md:table-cell">
                    {order.itemCount}
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-medium tabular-nums">
                    {formatPhp(order.totalCentavos)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <PaymentMethodBadge
                      paymentMethod={order.paymentMethod}
                      className="whitespace-nowrap"
                    />
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link
                        href={`/admin/orders/${order.orderNumber}`}
                        aria-label={`View order ${order.orderNumber}`}
                      >
                        View <ArrowRight aria-hidden="true" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Pagination
            basePath="/admin/orders"
            page={result.page}
            pageCount={result.pageCount}
            total={result.total}
            params={{
              q: search || undefined,
              status: result.status === "ALL" ? undefined : result.status,
            }}
            className="mt-4"
          />
        </Card>
      )}
    </div>
  );
}
