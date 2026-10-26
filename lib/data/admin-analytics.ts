import "server-only";
import { cache } from "react";
import { subDays } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { prisma } from "@/lib/db";
import type { OrderStatus, PaymentMethod } from "@prisma/client";

const MANILA_TIME_ZONE = "Asia/Manila";
const SALES_STATUSES: OrderStatus[] = ["PAID", "SHIPPED", "DELIVERED"];
const CHART_DAYS = 30;

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

export type AdminAnalytics = {
  totalSalesCentavos: number;
  totalOrders: number;
  activeProducts: number;
  lowStockCount: number;
  lowStockItems: AdminLowStockItem[];
  recentOrders: AdminRecentOrder[];
  dailySales: AdminDailySales[];
  chartDays: number;
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

export const getAdminAnalytics = cache(async (): Promise<AdminAnalytics> => {
  const days = lastThirtyManilaDays();
  const periodStart = days[0].start;

  const [salesAggregate, totalOrders, activeProducts, activeVariants, periodOrders, recentOrders] =
    await Promise.all([
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
  };
});
