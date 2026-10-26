import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { requirePageAdmin } from "@/lib/auth-guards";
import { getAdminOrderList } from "@/lib/data/admin-orders";
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
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Orders",
  robots: { index: false, follow: false },
};

type AdminOrdersPageProps = {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
};

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

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold sm:text-4xl">Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Investigate payments, verify GCash receipts, and move fulfilment forward safely.
        </p>
      </header>

      <Card className="p-4">
        <form method="get" className="flex flex-wrap items-end gap-2">
          <div className="min-w-[220px] flex-1">
            <label htmlFor="order-search" className="mb-1.5 block text-xs font-medium text-muted-foreground">
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
          <div>
            <label htmlFor="order-status" className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Status
            </label>
            <select
              id="order-status"
              name="status"
              defaultValue={result.status === "ALL" ? "" : result.status}
              className="h-11 rounded-xl border border-input bg-white/[0.035] px-3.5 text-sm text-foreground focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20"
            >
              <option value="">All statuses</option>
              {orderStatuses.map((status) => (
                <option key={status} value={status}>
                  {orderStatusLabels[status]}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" variant="outline">
            <Search aria-hidden="true" /> Apply
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
                <TableHead>Placed</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.orders.map((order) => (
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
                    <span className="block text-sm">{order.contactName}</span>
                    <span className="block text-xs text-muted-foreground">{order.contactEmail}</span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatDateTime(order.createdAt)}
                  </TableCell>
                  <TableCell className="text-sm tabular-nums">{order.itemCount}</TableCell>
                  <TableCell className="whitespace-nowrap font-medium tabular-nums">
                    {formatPhp(order.totalCentavos)}
                  </TableCell>
                  <TableCell>
                    <PaymentMethodBadge paymentMethod={order.paymentMethod} />
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/orders/${order.orderNumber}`}>Investigate</Link>
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
