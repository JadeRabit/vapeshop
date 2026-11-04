import "server-only";
import { cache } from "react";
import { subDays } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { prisma } from "@/lib/db";
import type { OrderStatus, PaymentMethod } from "@prisma/client";

const MANILA_TIME_ZONE = "Asia/Manila";
const SALES_STATUSES: OrderStatus[] = ["PAID", "SHIPPED", "DELIVERED"];
const CHART_DAYS = 30;
const ATTENTION_AFTER_HOURS = 24;

export type AdminLowStockItem = {
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  variantLabel: string;
  sku: string;
  stock: number;
  lowStockThreshold: number;
};

export type AdminRecentOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  contactEmail: string;
  totalCentavos: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  createdAt: string;
};

export type AdminDailySales = {
  date: string;
  label: string;
  revenueCentavos: number;
  orderCount: number;
};

export type AdminStatusCounts = Record<OrderStatus, number> & { ALL: number };

export type AdminAttentionOrder = {
  id: string;
  orderNumber: string;
  contactName: string;
  totalCentavos: number;
  paymentMethod: PaymentMethod;
  createdAt: string;
  reason: "PROOF" | "AGING";
};

export type AdminTopProduct = {
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  variantLabel: string;
  quantity: number;
  revenueCentavos: number;
};

export type AdminTodayStats = {
  salesCentavos: number;
  orders: number;
  pending: number;
};

export type AdminPeriodComparison = {
  revenuePct: number | null;
  ordersPct: number | null;
  previousRevenueCentavos: number;
  previousOrders: number;
};

export type AdminAnalytics = {
  totalSalesCentavos: number;
  totalOrders: number;
  activeProducts: number;
  lowStockCount: number;
  lowStockItems: AdminLowStockItem[];
  recentOrders: AdminRecentOrder[];
  dailySales: AdminDailySales[];
  chartDays: number;
  statusCounts: AdminStatusCounts;
  today: AdminTodayStats;
  comparison: AdminPeriodComparison;
  attentionOrders: AdminAttentionOrder[];
  attentionCount: number;
  topProducts: AdminTopProduct[];
};

export type AdminNavBadges = {
  pendingOrders: number;
  lowStock: number;
  needsAttention: number;
};

function lastThirtyManilaDays() {
  const todayKey = formatInTimeZone(new Date(), MANILA_TIME_ZONE, "yyyy-MM-dd");
  const todayStart = fromZonedTime(`${todayKey}T00:00:00`, MANILA_TIME_ZONE);

  return Array.from({ length: CHART_DAYS }, (_, index) => {
    const start = subDays(todayStart, CHART_DAYS - 1 - index);
    return {
      date: formatInTimeZone(start, MANILA_TIME_ZONE, "yyyy-MM-dd"),
      label: formatInTimeZone(start, MANILA_TIME_ZONE, "MMM d"),
      start,
    };
  });
}

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}

function emptyStatusCounts(): AdminStatusCounts {
  return {
    ALL: 0,
    PENDING: 0,
    PAID: 0,
    SHIPPED: 0,
    DELIVERED: 0,
    CANCELLED: 0,
  };
}

export const getAdminAnalytics = cache(async (): Promise<AdminAnalytics> => {
  const days = lastThirtyManilaDays();
  const periodStart = days[0].start;
  const previousStart = subDays(periodStart, CHART_DAYS);
  const todayStart = fromZonedTime(
    `${formatInTimeZone(new Date(), MANILA_TIME_ZONE, "yyyy-MM-dd")}T00:00:00`,
    MANILA_TIME_ZONE,
  );
  const attentionCutoff = new Date(Date.now() - ATTENTION_AFTER_HOURS * 60 * 60 * 1000);

  const [
    salesAggregate,
    totalOrders,
    activeProducts,
    activeVariants,
    periodOrders,
    recentOrders,
    statusGroups,
    previousPeriod,
    todayOrders,
    attentionOrders,
    attentionCount,
    topProductGroups,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { status: { in: SALES_STATUSES } },
      _sum: { totalCentavos: true },
    }),
    prisma.order.count({ where: { status: { not: "CANCELLED" } } }),
    prisma.product.count({
      where: { isActive: true, variants: { some: { isActive: true } } },
    }),
    prisma.productVariant.findMany({
      where: { isActive: true },
      select: {
        id: true,
        label: true,
        sku: true,
        stock: true,
        lowStockThreshold: true,
        product: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.order.findMany({
      where: { status: { in: SALES_STATUSES }, createdAt: { gte: periodStart } },
      select: { totalCentavos: true, createdAt: true },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        orderNumber: true,
        contactName: true,
        contactEmail: true,
        totalCentavos: true,
        paymentMethod: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.order.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.order.aggregate({
      where: {
        status: { in: SALES_STATUSES },
        createdAt: { gte: previousStart, lt: periodStart },
      },
      _sum: { totalCentavos: true },
      _count: { _all: true },
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: todayStart } },
      select: { status: true, totalCentavos: true },
    }),
    prisma.order.findMany({
      where: {
        status: "PENDING",
        OR: [
          {
            paymentMethod: "GCASH",
            OR: [{ paymentReference: null }, { paymentProofId: null }],
          },
          { createdAt: { lt: attentionCutoff } },
        ],
      },
      orderBy: { createdAt: "asc" },
      take: 5,
      select: {
        id: true,
        orderNumber: true,
        contactName: true,
        totalCentavos: true,
        paymentMethod: true,
        paymentReference: true,
        paymentProofId: true,
        createdAt: true,
      },
    }),
    prisma.order.count({
      where: {
        status: "PENDING",
        OR: [
          {
            paymentMethod: "GCASH",
            OR: [{ paymentReference: null }, { paymentProofId: null }],
          },
          { createdAt: { lt: attentionCutoff } },
        ],
      },
    }),
    prisma.orderItem.groupBy({
      by: ["variantId"],
      where: {
        order: { status: { in: SALES_STATUSES }, createdAt: { gte: periodStart } },
      },
      _sum: { quantity: true, lineTotalCentavos: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
  ]);

  const lowStockVariants = activeVariants
    .filter((variant) => variant.stock <= variant.lowStockThreshold)
    .sort((a, b) => a.stock - b.stock || a.product.name.localeCompare(b.product.name));

  const lowStockItems = lowStockVariants.slice(0, 6).map((variant) => ({
    variantId: variant.id,
    productId: variant.product.id,
    productName: variant.product.name,
    productSlug: variant.product.slug,
    variantLabel: variant.label,
    sku: variant.sku,
    stock: variant.stock,
    lowStockThreshold: variant.lowStockThreshold,
  }));

  const salesByDay = new Map<string, { revenueCentavos: number; orderCount: number }>();
  for (const order of periodOrders) {
    const key = formatInTimeZone(order.createdAt, MANILA_TIME_ZONE, "yyyy-MM-dd");
    const current = salesByDay.get(key) ?? { revenueCentavos: 0, orderCount: 0 };
    current.revenueCentavos += order.totalCentavos;
    current.orderCount += 1;
    salesByDay.set(key, current);
  }

  const dailySales = days.map((day) => {
    const value = salesByDay.get(day.date) ?? { revenueCentavos: 0, orderCount: 0 };
    return {
      date: day.date,
      label: day.label,
      revenueCentavos: value.revenueCentavos,
      orderCount: value.orderCount,
    };
  });

  const statusCounts = emptyStatusCounts();
  for (const group of statusGroups) {
    statusCounts[group.status] = group._count._all;
    statusCounts.ALL += group._count._all;
  }

  const todaySales = todayOrders.filter((order) =>
    SALES_STATUSES.includes(order.status),
  );
  const today = {
    salesCentavos: todaySales.reduce((sum, order) => sum + order.totalCentavos, 0),
    orders: todayOrders.filter((order) => order.status !== "CANCELLED").length,
    pending: todayOrders.filter((order) => order.status === "PENDING").length,
  };

  const periodRevenue = periodOrders.reduce((sum, order) => sum + order.totalCentavos, 0);
  const previousRevenue = previousPeriod._sum.totalCentavos ?? 0;
  const comparison = {
    revenuePct: percentChange(periodRevenue, previousRevenue),
    ordersPct: percentChange(periodOrders.length, previousPeriod._count._all),
    previousRevenueCentavos: previousRevenue,
    previousOrders: previousPeriod._count._all,
  };

  const topVariantIds = topProductGroups.map((group) => group.variantId);
  const topVariants =
    topVariantIds.length > 0
      ? await prisma.productVariant.findMany({
          where: { id: { in: topVariantIds } },
          select: {
            id: true,
            label: true,
            product: { select: { id: true, name: true, slug: true } },
          },
        })
      : [];
  const topVariantMap = new Map(topVariants.map((variant) => [variant.id, variant]));

  const topProducts = topProductGroups.flatMap((group) => {
    const variant = topVariantMap.get(group.variantId);
    if (!variant) return [];
    return [
      {
        variantId: group.variantId,
        productId: variant.product.id,
        productName: variant.product.name,
        productSlug: variant.product.slug,
        variantLabel: variant.label,
        quantity: group._sum.quantity ?? 0,
        revenueCentavos: group._sum.lineTotalCentavos ?? 0,
      },
    ];
  });

  return {
    totalSalesCentavos: salesAggregate._sum.totalCentavos ?? 0,
    totalOrders,
    activeProducts,
    lowStockCount: lowStockVariants.length,
    lowStockItems,
    recentOrders: recentOrders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.contactName,
      contactEmail: order.contactEmail,
      totalCentavos: order.totalCentavos,
      paymentMethod: order.paymentMethod,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
    })),
    dailySales,
    chartDays: CHART_DAYS,
    statusCounts,
    today,
    comparison,
    attentionOrders: attentionOrders.map((order) => {
      const proofMissing =
        order.paymentMethod === "GCASH" &&
        (!order.paymentReference || !order.paymentProofId);
      return {
        id: order.id,
        orderNumber: order.orderNumber,
        contactName: order.contactName,
        totalCentavos: order.totalCentavos,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt.toISOString(),
        reason: proofMissing ? "PROOF" : "AGING",
      };
    }),
    attentionCount,
    topProducts,
  };
});

/**
 * Lightweight counters for the admin sidebar. Kept separate from the full
 * analytics query so catalogue and order pages do not pay for dashboard data.
 */
export const getAdminNavBadges = cache(async (): Promise<AdminNavBadges> => {
  const attentionCutoff = new Date(Date.now() - ATTENTION_AFTER_HOURS * 60 * 60 * 1000);
  const [pendingOrders, activeVariants, needsAttention] = await Promise.all([
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.productVariant.findMany({
      where: { isActive: true },
      select: { productId: true, stock: true, lowStockThreshold: true },
    }),
    prisma.order.count({
      where: {
        status: "PENDING",
        OR: [
          {
            paymentMethod: "GCASH",
            OR: [{ paymentReference: null }, { paymentProofId: null }],
          },
          { createdAt: { lt: attentionCutoff } },
        ],
      },
    }),
  ]);

  return {
    pendingOrders,
    lowStock: new Set(
      activeVariants
        .filter((variant) => variant.stock <= variant.lowStockThreshold)
        .map((variant) => variant.productId),
    ).size,
    needsAttention,
  };
});
