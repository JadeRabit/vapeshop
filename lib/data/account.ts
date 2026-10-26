import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";

export type AddressDTO = {
  id: string;
  label: string | null;
  recipientName: string;
  phone: string;
  line1: string;
  line2: string | null;
  barangay: string | null;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
};

export const getAddresses = cache(async (userId: string): Promise<AddressDTO[]> => {
  const addresses = await prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return addresses.map((address) => ({
    id: address.id,
    label: address.label,
    recipientName: address.recipientName,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2,
    barangay: address.barangay,
    city: address.city,
    province: address.province,
    postalCode: address.postalCode,
    country: address.country,
    isDefault: address.isDefault,
    createdAt: address.createdAt.toISOString(),
  }));
});

export type OrderSummaryDTO = {
  id: string;
  orderNumber: string;
  status: "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  paymentMethod: "COD" | "GCASH" | "CARD";
  totalCentavos: number;
  itemCount: number;
  itemSummary: string;
  createdAt: string;
};

export const getOrderSummaries = cache(async (userId: string): Promise<OrderSummaryDTO[]> => {
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { items: { select: { productName: true, quantity: true } } },
  });

  return orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentMethod: order.paymentMethod,
    totalCentavos: order.totalCentavos,
    itemCount: order.items.reduce((total, item) => total + item.quantity, 0),
    itemSummary: order.items
      .map((item) => `${item.productName} × ${item.quantity}`)
      .slice(0, 3)
      .join(", "),
    createdAt: order.createdAt.toISOString(),
  }));
});

export type OrderDetailDTO = {
  id: string;
  orderNumber: string;
  status: "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  paymentMethod: "COD" | "GCASH" | "CARD";
  paymentReference: string | null;
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
    productSlug: string | null;
  }>;
  events: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    note: string | null;
    createdAt: string;
  }>;
};

export const getOrderForUser = cache(
  async (orderNumber: string, userId: string): Promise<OrderDetailDTO | null> => {
    const order = await prisma.order.findFirst({
      where: { orderNumber, userId },
      include: {
        items: {
          include: { variant: { select: { product: { select: { slug: true } } } } },
        },
        events: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!order) return null;

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentReference: order.paymentReference,
      subtotalCentavos: order.subtotalCentavos,
      shippingCentavos: order.shippingCentavos,
      totalCentavos: order.totalCentavos,
      contactName: order.contactName,
      contactEmail: order.contactEmail,
      contactPhone: order.contactPhone,
      notes: order.notes,
      shippingAddress: (order.shippingAddress ?? {}) as OrderDetailDTO["shippingAddress"],
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
        createdAt: event.createdAt.toISOString(),
      })),
    };
  },
);
