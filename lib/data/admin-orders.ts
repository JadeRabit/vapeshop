import "server-only";
import { cache } from "react";
import { type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { orderStatuses, siteConfig } from "@/lib/config";

export type AdminOrderStatus = (typeof orderStatuses)[number];

export type AdminOrderSummaryDTO = {
  id: string;
  orderNumber: string;
  contactName: string;
  contactEmail: string;
  status: AdminOrderStatus;
  paymentMethod: "COD" | "GCASH" | "CARD";
  totalCentavos: number;
  itemCount: number;
  createdAt: string;
};

export type AdminOrderListResult = {
  orders: AdminOrderSummaryDTO[];
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
  search: string;
  status: AdminOrderStatus | "ALL";
};

export type AdminOrderDetailDTO = {
  id: string;
  orderNumber: string;
  status: AdminOrderStatus;
  paymentMethod: "COD" | "GCASH" | "CARD";
  paymentReference: string | null;
  hasPaymentProof: boolean;
  proofUploadedAt: string | null;
  proofMimeType: string | null;
  subtotalCentavos: number;
  shippingCentavos: number;
  totalCentavos: number;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  notes: string | null;
  shippingAddress: {
    recipientName?: string;
    phone?: string;
    line1?: string;
    line2?: string | null;
    barangay?: string | null;
    city?: string;
    province?: string;
    postalCode?: string;
    country?: string;
  };
  customer: {
    id: string;
    name: string | null;
    email: string;
  };
  createdAt: string;
  paidAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  items: Array<{
    id: string;
    productName: string;
    variantLabel: string;
    sku: string;
    unitPriceCentavos: number;
    quantity: number;
    lineTotalCentavos: number;
    productSlug: string;
  }>;
  events: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    note: string | null;
    actorName: string | null;
    createdAt: string;
  }>;
};

function normalizeStatus(value: string | undefined): AdminOrderStatus | "ALL" {
  return value && (orderStatuses as readonly string[]).includes(value)
    ? (value as AdminOrderStatus)
    : "ALL";
}

export async function getAdminOrderList({
  search = "",
  status,
  page = 1,
}: {
  search?: string;
  status?: string;
  page?: number;
}): Promise<AdminOrderListResult> {
  const normalizedSearch = search.trim().slice(0, 100);
  const normalizedStatus = normalizeStatus(status);
  const pageSize = siteConfig.pageSize;
  const requestedPage = Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1;

  const where: Prisma.OrderWhereInput = {
    ...(normalizedStatus === "ALL" ? {} : { status: normalizedStatus }),
    ...(normalizedSearch
      ? {
          OR: [
            { orderNumber: { contains: normalizedSearch, mode: "insensitive" } },
            { contactName: { contains: normalizedSearch, mode: "insensitive" } },
            { contactEmail: { contains: normalizedSearch, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (requestedPage - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        orderNumber: true,
        contactName: true,
        contactEmail: true,
        status: true,
        paymentMethod: true,
        totalCentavos: true,
        createdAt: true,
        items: { select: { quantity: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return {
    orders: orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      contactName: order.contactName,
      contactEmail: order.contactEmail,
      status: order.status,
      paymentMethod: order.paymentMethod,
      totalCentavos: order.totalCentavos,
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      createdAt: order.createdAt.toISOString(),
    })),
    total,
    page: requestedPage,
    pageCount,
    pageSize,
    search: normalizedSearch,
    status: normalizedStatus,
  };
}

export const getAdminOrder = cache(
  async (orderNumber: string): Promise<AdminOrderDetailDTO | null> => {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        user: { select: { id: true, name: true, email: true } },
        paymentProof: { select: { mimeType: true, createdAt: true } },
        items: {
          include: { variant: { select: { product: { select: { slug: true } } } } },
        },
        events: {
          orderBy: { createdAt: "asc" },
          include: { actor: { select: { name: true } } },
        },
      },
    });

    if (!order) return null;

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentReference: order.paymentReference,
      hasPaymentProof: Boolean(order.paymentProof),
      proofUploadedAt: order.paymentProof?.createdAt.toISOString() ?? null,
      proofMimeType: order.paymentProof?.mimeType ?? null,
      subtotalCentavos: order.subtotalCentavos,
      shippingCentavos: order.shippingCentavos,
      totalCentavos: order.totalCentavos,
      contactName: order.contactName,
      contactEmail: order.contactEmail,
      contactPhone: order.contactPhone,
      notes: order.notes,
      shippingAddress: (order.shippingAddress ?? {}) as AdminOrderDetailDTO["shippingAddress"],
      customer: order.user,
      createdAt: order.createdAt.toISOString(),
      paidAt: order.paidAt?.toISOString() ?? null,
      shippedAt: order.shippedAt?.toISOString() ?? null,
      deliveredAt: order.deliveredAt?.toISOString() ?? null,
      cancelledAt: order.cancelledAt?.toISOString() ?? null,
      items: order.items.map((item) => ({
        id: item.id,
        productName: item.productName,
        variantLabel: item.variantLabel,
        sku: item.sku,
        unitPriceCentavos: item.unitPriceCentavos,
        quantity: item.quantity,
        lineTotalCentavos: item.lineTotalCentavos,
        productSlug: item.variant.product.slug,
      })),
      events: order.events.map((event) => ({
        id: event.id,
        fromStatus: event.fromStatus,
        toStatus: event.toStatus,
        note: event.note,
        actorName: event.actor?.name ?? null,
        createdAt: event.createdAt.toISOString(),
      })),
    };
  },
);
