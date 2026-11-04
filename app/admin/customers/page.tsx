import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Repeat2, Search, UserPlus, Users, Wallet } from "lucide-react";
import { requirePageAdmin } from "@/lib/auth-guards";
import { getAdminCustomerList } from "@/lib/data/admin-customers";
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
import { formatPhp } from "@/lib/money";
import { formatDate, formatRelativeTime, getInitials } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Customers",
  robots: { index: false, follow: false },
};

type AdminCustomersPageProps = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

export default async function AdminCustomersPage({ searchParams }: AdminCustomersPageProps) {
  await requirePageAdmin();
  const params = await searchParams;
  const search = params.q?.trim() ?? "";
  const page = Number.parseInt(params.page ?? "1", 10);

  const result = await getAdminCustomerList({
    search,
    page: Number.isFinite(page) ? page : 1,
  });

  const summaryItems = [
    {
      label: "Total customers",
      value: result.summary.totalCustomers.toLocaleString("en-PH"),
      hint: "Registered customer accounts.",
      icon: Users,
    },
    {
      label: "New this month",
      value: result.summary.newThisMonth.toLocaleString("en-PH"),
      hint: "Accounts created since the 1st.",
      icon: UserPlus,
    },
    {
      label: "Repeat buyers",
      value: result.summary.repeatCustomers.toLocaleString("en-PH"),
      hint: "Customers with two or more orders.",
      icon: Repeat2,
    },
    {
      label: "Customer revenue",
      value: formatPhp(result.summary.lifetimeCentavos),
      hint: "Paid, shipped, and delivered orders.",
      icon: Wallet,
    },
  ];

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
          Relationships
        </p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Customers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          See who is buying, how often they return, and what they have spent.
        </p>
      </header>

      <section
        aria-label="Customer summary"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {summaryItems.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="p-4">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-primary">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-1 text-xl font-semibold tabular-nums">{item.value}</p>
                  <p className="mt-0.5 text-[11px] leading-5 text-muted-foreground">
                    {item.hint}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </section>

      <Card className="p-4">
        <form method="get" className="flex flex-wrap items-end gap-2">
          <div className="min-w-[240px] flex-1">
            <label
              htmlFor="customer-search"
              className="mb-1.5 block text-xs font-medium text-muted-foreground"
            >
              Search by name, email, or phone
            </label>
            <Input
              id="customer-search"
              name="q"
              type="search"
              defaultValue={search}
              placeholder="Mika or mika@email.com"
            />
          </div>
          <Button type="submit" variant="outline">
            <Search aria-hidden="true" /> Search
          </Button>
          {search ? (
            <Button asChild variant="ghost">
              <Link href="/admin/customers">Clear</Link>
            </Button>
          ) : null}
        </form>
      </Card>

      {result.customers.length === 0 ? (
        <EmptyState
          icon={<Users className="size-6" aria-hidden="true" />}
          title={search ? "No customers matched." : "No customers yet."}
          description={
            search
              ? `Nothing matched “${search}”. Try a different name, email, or phone number.`
              : "Customer accounts appear here after registration or their first checkout."
          }
          action={
            search ? (
              <Button asChild variant="outline">
                <Link href="/admin/customers">Clear search</Link>
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
                <TableHead>Customer</TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Lifetime spend</TableHead>
                <TableHead className="hidden lg:table-cell">Last order</TableHead>
                <TableHead className="hidden xl:table-cell">Joined</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full border border-primary/20 bg-primary/[0.08] text-[11px] font-bold text-primary">
                        {getInitials(customer.name)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">
                          {customer.name ?? "Unnamed customer"}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {customer.email}
                        </span>
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap text-xs text-muted-foreground md:table-cell">
                    {customer.phone ?? "—"}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-sm tabular-nums">
                      {customer.orderCount}
                      {customer.isRepeat ? (
                        <span className="rounded-full border border-secondary/20 bg-secondary/10 px-1.5 py-0.5 text-[10px] font-semibold text-secondary">
                          Repeat
                        </span>
                      ) : null}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-medium tabular-nums">
                    {formatPhp(customer.lifetimeCentavos)}
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap text-xs text-muted-foreground lg:table-cell">
                    {customer.lastOrderAt ? (
                      <>
                        <span className="block">{formatDate(customer.lastOrderAt)}</span>
                        <span className="block text-[11px]">
                          {formatRelativeTime(customer.lastOrderAt)}
                        </span>
                      </>
                    ) : (
                      "No orders yet"
                    )}
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap text-xs text-muted-foreground xl:table-cell">
                    {formatDate(customer.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link
                        href={`/admin/orders?q=${encodeURIComponent(customer.email)}`}
                        aria-label={`View orders for ${customer.email}`}
                      >
                        Orders <ArrowRight aria-hidden="true" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Pagination
            basePath="/admin/customers"
            page={result.page}
            pageCount={result.pageCount}
            total={result.total}
            params={{ q: search || undefined }}
            className="mt-4"
          />
        </Card>
      )}
    </div>
  );
}
