"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { calculateShipping } from "@/lib/money";
import { cancelPendingOrderAndRestock } from "@/lib/orders";
import { createOrderCheckoutSession, retrieveCheckoutSession } from "@/lib/payments/stripe";
import { siteConfig } from "@/lib/config";
import {
  checkoutInputSchema,
  checkoutQuoteSchema,
  type CheckoutLineInput,
} from "@/lib/validators/checkout";
import type { CheckoutQuoteLine, CheckoutQuoteResult } from "@/lib/checkout-types";
import type { CheckoutActionState } from "@/lib/action-result";

class CheckoutError extends Error {
  field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.name = "CheckoutError";
    this.field = field;
  }
}

function fieldErrorsFrom(error: {
  flatten: () => { fieldErrors: Record<string, string[] | undefined> };
}) {
  return Object.fromEntries(
    Object.entries(error.flatten().fieldErrors).filter((entry): entry is [string, string[]] =>
      Boolean(entry[1]?.length),
    ),
  );
}

function generateOrderNumber() {
  const time = Date.now().toString(36).toUpperCase().slice(-6);
  const random = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `VD-${time}${random}`;
}

function normalizeLines(lines: CheckoutLineInput[]) {
  const ids = new Set<string>();
  for (const line of lines) {
    if (ids.has(line.variantId)) {
      throw new CheckoutError("Your cart contains duplicate items. Refresh and try again.");
    }
    ids.add(line.variantId);
  }
  return lines;
}

async function loadCurrentVariants(lineIds: string[]) {
  return prisma.productVariant.findMany({
    where: { id: { in: lineIds } },
    include: {
      product: {
        include: {
          category: { select: { isActive: true, name: true, slug: true } },
          images: {
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
            take: 1,
            select: { alt: true, media: { select: { secureUrl: true } } },
          },
        },
      },
    },
  });
}

export async function getCheckoutQuoteAction(input: {
  lines: CheckoutLineInput[];
}): Promise<CheckoutQuoteResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, message: "Sign in to continue to checkout." };

  const parsed = checkoutQuoteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Your cart is invalid. Remove the affected items and try again." };
  }

  try {
    const lines = normalizeLines(parsed.data.lines);
    const variants = await loadCurrentVariants(lines.map((line) => line.variantId));
    const variantMap = new Map(variants.map((variant) => [variant.id, variant]));

    let subtotal = 0;
    let hasIssues = false;

    const quoteLines = lines.map<CheckoutQuoteLine>((line) => {
      const variant = variantMap.get(line.variantId);
      if (!variant) {
        hasIssues = true;
        return {
          variantId: line.variantId,
          productName: "Unavailable item",
          productSlug: "",
          variantLabel: "",
          sku: "",
          unitPriceCentavos: 0,
          quantity: line.quantity,
          lineTotalCentavos: 0,
          stock: 0,
          imageUrl: null,
          imageAlt: "",
          issue: "This item is no longer available.",
        };
      }

      const unavailable =
        !variant.isActive || !variant.product.isActive || !variant.product.category.isActive;
      const insufficient = variant.stock < line.quantity;
      const issue = unavailable
        ? "This item is no longer available."
        : insufficient
          ? `Only ${variant.stock} left at the moment.`
          : null;

      if (issue) hasIssues = true;
      const lineTotal = variant.priceCentavos * line.quantity;
      subtotal += lineTotal;

      return {
        variantId: variant.id,
        productName: variant.product.name,
        productSlug: variant.product.slug,
        variantLabel: variant.label,
        sku: variant.sku,
        unitPriceCentavos: variant.priceCentavos,
        quantity: line.quantity,
        lineTotalCentavos: lineTotal,
        stock: variant.stock,
        imageUrl: variant.product.images[0]?.media.secureUrl ?? null,
        imageAlt: variant.product.images[0]?.alt ?? `${variant.product.name} product image`,
        issue,
      };
    });

    const shipping = calculateShipping(
      subtotal,
      siteConfig.freeShippingThresholdCentavos,
      siteConfig.shippingFlatCentavos,
    );

    return {
      ok: true,
      lines: quoteLines,
      subtotalCentavos: subtotal,
      shippingCentavos: shipping,
      totalCentavos: subtotal + shipping,
      hasIssues,
    };
  } catch (error) {
    if (error instanceof CheckoutError) {
      return { ok: false, message: error.message };
    }
    console.error("Checkout quote failed", error);
    return { ok: false, message: "We could not refresh your cart. Please try again." };
  }
}

export async function placeOrderAction(
  _previous: CheckoutActionState,
  formData: FormData,
): Promise<CheckoutActionState> {
  const user = await getSessionUser();
  if (!user) return { ok: false, message: "Sign in to place an order." };

  let rawLines: unknown = [];
  try {
    rawLines = JSON.parse(String(formData.get("lines") ?? "[]"));
  } catch {
    return { ok: false, message: "Your cart could not be read. Refresh and try again." };
  }

  const parsed = checkoutInputSchema.safeParse({
    addressId: formData.get("addressId"),
    paymentMethod: formData.get("paymentMethod"),
    gcashReference: formData.get("gcashReference") ?? undefined,
    paymentProofMediaId: formData.get("paymentProofMediaId") ?? undefined,
    notes: formData.get("notes") ?? undefined,
    idempotencyKey: formData.get("idempotencyKey"),
    lines: rawLines,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the highlighted checkout fields.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  const input = parsed.data;

  if (input.paymentMethod === "CARD" && !env.isStripeConfigured) {
    return { ok: false, message: "Card payment is not available right now." };
  }
  if (input.paymentMethod === "GCASH" && !input.paymentProofMediaId) {
    return { ok: false, message: "Upload your GCash receipt before placing the order." };
  }

  const existingOrder = await prisma.order.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
    include: {
      items: {
        select: { productName: true, variantLabel: true, unitPriceCentavos: true, quantity: true },
      },
    },
  });

  if (existingOrder) {
    if (existingOrder.userId !== user.id) {
      return { ok: false, message: "That checkout reference is no longer valid." };
    }
    if (existingOrder.status === "CANCELLED") {
      return {
        ok: false,
        rotateKey: true,
        message:
          "That checkout attempt was cancelled and its stock was released. Review your cart and submit again.",
      };
    }
    if (existingOrder.status !== "PENDING") {
      return { ok: true, orderNumber: existingOrder.orderNumber };
    }
    if (existingOrder.paymentMethod === "CARD" && existingOrder.stripeCheckoutSessionId) {
      try {
        const existingSession = await retrieveCheckoutSession(
          existingOrder.stripeCheckoutSessionId,
        );
        if (existingSession?.status === "open" && existingSession.url) {
          return {
            ok: true,
            checkoutUrl: existingSession.url,
            orderNumber: existingOrder.orderNumber,
          };
        }
        if (existingSession?.status === "complete") {
          return { ok: true, orderNumber: existingOrder.orderNumber };
        }
      } catch (error) {
        console.error("Stripe session lookup failed", error);
        return {
          ok: false,
          message: "We could not resume card payment. Please try again in a moment.",
        };
      }
    }
    if (existingOrder.paymentMethod === "CARD") {
      try {
        const stripe = await createOrderCheckoutSession({
          id: existingOrder.id,
          orderNumber: existingOrder.orderNumber,
          contactEmail: existingOrder.contactEmail,
          totalCentavos: existingOrder.totalCentavos,
          shippingCentavos: existingOrder.shippingCentavos,
          items: existingOrder.items,
        });
        if (stripe?.url) {
          await prisma.order.update({
            where: { id: existingOrder.id },
            data: {
              stripeCheckoutSessionId: stripe.id,
              stripePaymentIntentId:
                typeof stripe.payment_intent === "string" ? stripe.payment_intent : null,
            },
          });
          return {
            ok: true,
            checkoutUrl: stripe.url,
            orderNumber: existingOrder.orderNumber,
          };
        }
      } catch (error) {
        console.error("Stripe session creation failed for existing order", error);
        return {
          ok: false,
          message: "We could not resume card payment. Please try again in a moment.",
        };
      }
    }
    return { ok: true, orderNumber: existingOrder.orderNumber };
  }

  const [address, databaseUser] = await Promise.all([
    prisma.address.findFirst({
      where: { id: input.addressId, userId: user.id },
    }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { email: true, name: true },
    }),
  ]);

  if (!address) {
    return {
      ok: false,
      message: "Choose a saved delivery address.",
      fieldErrors: { addressId: ["Address not found."] },
    };
  }
  if (!databaseUser) {
    return { ok: false, message: "Your account is no longer available." };
  }

  let paymentProofId: string | null = null;
  if (input.paymentMethod === "GCASH") {
    const proof = await prisma.mediaAsset.findFirst({
      where: {
        id: input.paymentProofMediaId,
        ownerId: user.id,
        kind: "PAYMENT_PROOF",
      },
      select: { id: true },
    });
    if (!proof) {
      return {
        ok: false,
        message: "The uploaded GCash receipt could not be verified.",
        fieldErrors: { paymentProofMediaId: ["Upload your receipt again."] },
      };
    }
    paymentProofId = proof.id;

    const duplicateReference = await prisma.order.findFirst({
      where: { paymentMethod: "GCASH", paymentReference: input.gcashReference },
      select: { id: true },
    });
    if (duplicateReference) {
      return {
        ok: false,
        message: "That GCash reference has already been used.",
        fieldErrors: { gcashReference: ["This reference is already attached to an order."] },
      };
    }
  }

  const shippingAddress = {
    recipientName: address.recipientName,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2,
    barangay: address.barangay,
    city: address.city,
    province: address.province,
    postalCode: address.postalCode,
    country: address.country,
  };

  let order:
    | {
        id: string;
        orderNumber: string;
        contactEmail: string;
        totalCentavos: number;
        shippingCentavos: number;
        items: Array<{
          productName: string;
          variantLabel: string;
          unitPriceCentavos: number;
          quantity: number;
        }>;
      }
    | undefined;

  try {
    const lines = normalizeLines(input.lines);

    order = await prisma.$transaction(async (transaction) => {
      const variants = await transaction.productVariant.findMany({
        where: { id: { in: lines.map((line) => line.variantId) } },
        include: {
          product: {
            include: {
              category: { select: { isActive: true, name: true, slug: true } },
            },
          },
        },
      });
      const variantMap = new Map(variants.map((variant) => [variant.id, variant]));

      const orderItems = lines.map((line) => {
        const variant = variantMap.get(line.variantId);
        if (
          !variant ||
          !variant.isActive ||
          !variant.product.isActive ||
          !variant.product.category.isActive
        ) {
          throw new CheckoutError("An item in your cart is no longer available.", "lines");
        }
        if (variant.stock < line.quantity) {
          throw new CheckoutError(
            `Only ${variant.stock} of ${variant.product.name} (${variant.label}) remain.`,
            "lines",
          );
        }
        return {
          variantId: variant.id,
          productName: variant.product.name,
          variantLabel: variant.label,
          sku: variant.sku,
          unitPriceCentavos: variant.priceCentavos,
          quantity: line.quantity,
          lineTotalCentavos: variant.priceCentavos * line.quantity,
        };
      });

      for (const item of orderItems) {
        const updated = await transaction.productVariant.updateMany({
          where: {
            id: item.variantId,
            isActive: true,
            stock: { gte: item.quantity },
            priceCentavos: item.unitPriceCentavos,
          },
          data: { stock: { decrement: item.quantity } },
        });
        if (updated.count !== 1) {
          throw new CheckoutError(
            "An item changed while you were checking out. Review your cart and try again.",
            "lines",
          );
        }
      }

      const subtotalCentavos = orderItems.reduce((sum, item) => sum + item.lineTotalCentavos, 0);
      const shippingCentavos = calculateShipping(
        subtotalCentavos,
        siteConfig.freeShippingThresholdCentavos,
        siteConfig.shippingFlatCentavos,
      );
      const totalCentavos = subtotalCentavos + shippingCentavos;
      const orderNumber = generateOrderNumber();

      const created = await transaction.order.create({
        data: {
          orderNumber,
          userId: user.id,
          status: "PENDING",
          paymentMethod: input.paymentMethod,
          subtotalCentavos,
          shippingCentavos,
          totalCentavos,
          shippingAddress,
          contactName: address.recipientName,
          contactEmail: databaseUser.email,
          contactPhone: address.phone,
          notes: input.notes || null,
          paymentReference: input.paymentMethod === "GCASH" ? (input.gcashReference ?? null) : null,
          paymentProofId,
          idempotencyKey: input.idempotencyKey,
          items: { create: orderItems },
          events: {
            create: {
              fromStatus: null,
              toStatus: "PENDING",
              note:
                input.paymentMethod === "COD"
                  ? "Order placed. Cash on delivery."
                  : input.paymentMethod === "GCASH"
                    ? "Order placed. Awaiting GCash verification."
                    : "Order placed. Awaiting card payment.",
            },
          },
        },
        include: {
          items: {
            select: {
              productName: true,
              variantLabel: true,
              unitPriceCentavos: true,
              quantity: true,
            },
          },
        },
      });

      return created;
    });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return {
        ok: false,
        message: error.message,
        fieldErrors: error.field ? { [error.field]: [error.message] } : undefined,
      };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        const target = Array.isArray(error.meta?.target)
          ? error.meta.target.join(",")
          : String(error.meta?.target ?? "");
        if (target.includes("paymentReference") || target.includes("paymentMethod")) {
          return {
            ok: false,
            message: "That GCash reference has already been used.",
            fieldErrors: { gcashReference: ["This reference is already attached to an order."] },
          };
        }
        if (target.includes("idempotencyKey")) {
          const existing = await prisma.order.findUnique({
            where: { idempotencyKey: input.idempotencyKey },
            select: { orderNumber: true, userId: true },
          });
          if (existing?.userId === user.id) {
            return { ok: true, orderNumber: existing.orderNumber };
          }
        }
      }
      console.error("Order placement database error", error.code);
    } else {
      console.error("Order placement failed", error);
    }
    return {
      ok: false,
      message: "We could not place your order. Your cart is unchanged — try again.",
    };
  }

  revalidatePath("/products");
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/checkout/success/${order.orderNumber}`);

  if (input.paymentMethod !== "CARD") {
    return { ok: true, orderNumber: order.orderNumber };
  }

  try {
    const session = await createOrderCheckoutSession(order);
    if (!session.url) throw new Error("Stripe did not return a checkout URL.");

    await prisma.order.update({
      where: { id: order.id },
      data: {
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId:
          typeof session.payment_intent === "string" ? session.payment_intent : null,
      },
    });

    return { ok: true, orderNumber: order.orderNumber, checkoutUrl: session.url };
  } catch (error) {
    console.error("Stripe session creation failed", error);
    const cancelled = await cancelPendingOrderAndRestock({
      orderId: order.id,
      note: "Card checkout could not be started; stock released.",
    });
    revalidatePath("/products");
    return {
      ok: false,
      rotateKey: cancelled,
      message: cancelled
        ? "We could not start card payment, so the order was cancelled and your cart is unchanged."
        : "We could not start card payment. Your cart is unchanged; please try again.",
    };
  }
}
