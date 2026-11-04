import "server-only";
import { type Prisma } from "@prisma/client";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { prisma } from "@/lib/db";
import { siteConfig } from "@/lib/config";

const MANILA_TIME_ZONE = "Asia/Manila";
const SALES_STATUSES = ["PAID", "SHIPPED", "DELIVERED"] as const;

export type AdminCustomerDTO = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  createdAt: string;
  orderCount: number;
  lifetimeCentavos: number;
  lastOrderAt: string | null;
  isRepeat: boolean;
};

export type AdminCustomerSummary = {
  totalCustomers: number;
  newThisMonth: number;
  repeatCustomers: number;
  lifetimeCentavos: number;
};

export type AdminCustomerListResult = {
  customers: AdminCustomerDTO[];
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
  search: string;
  summary: AdminCustomerSummary;
};

export async function getAdminCustomerList({
  search = "",
  page = 1,
}: {
  search?: string;
  page?: number;
}): Promise<AdminCustomerListResult> {
  const normalizedSearch = search.trim().slice(0, 100);
  const pageSize = siteConfig.pageSize;
  const requestedPage = Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1;
  const monthStart = fromZonedTime(
    `${formatInTimeZone(new Date(), MANILA_TIME_ZONE, "yyyy-MM")}-01T00:00:00`,
    MANILA_TIME_ZONE,
  );

  const where: Prisma.UserWhereInput = {
    role: "CUSTOMER",
    ...(normalizedSearch
      ? {
          OR: [
            { name: { contains: normalizedSearch, mode: "insensitive" } },
            { email: { contains: normalizedSearch, mode: "insensitive" } },
            { phone: { contains: normalizedSearch, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [users, total, allCustomers, lifetimeAggregate] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (requestedPage - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        orders: {
          orderBy: { createdAt: "desc" },
          select: { status: true, totalCentavos: true, createdAt: true },
        },
      },
    }),
    prisma.user.count({ where }),
    prisma.user.findMany({
      where: { role: "CUSTOMER" },
      select: { createdAt: true, _count: { select: { orders: true } } },
    }),
    prisma.order.aggregate({
      where: {
        status: { in: [...SALES_STATUSES] },
        user: { role: "CUSTOMER" },
      },
      _sum: { totalCentavos: true },
    }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return {
    customers: users.map((user) => {
      const liveOrders = user.orders.filter((order) => order.status !== "CANCELLED");
      const lifetimeCentavos = user.orders
        .filter((order) => (SALES_STATUSES as readonly string[]).includes(order.status))
        .reduce((sum, order) => sum + order.totalCentavos, 0);

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        createdAt: user.createdAt.toISOString(),
        orderCount: liveOrders.length,
        lifetimeCentavos,
        lastOrderAt: user.orders[0]?.createdAt.toISOString() ?? null,
        isRepeat: liveOrders.length >= 2,
      };
    }),
    total,
    page: requestedPage,
    pageCount,
    pageSize,
    search: normalizedSearch,
    summary: {
      totalCustomers: allCustomers.length,
      newThisMonth: allCustomers.filter((customer) => customer.createdAt >= monthStart).length,
      repeatCustomers: allCustomers.filter((customer) => customer._count.orders >= 2).length,
      lifetimeCentavos: lifetimeAggregate._sum.totalCentavos ?? 0,
    },
  };
}
