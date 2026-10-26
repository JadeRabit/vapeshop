import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { getStripe } from "@/lib/payments/stripe";
import { cancelPendingOrderAndRestock } from "@/lib/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function markCardOrderPaid(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId;
  if (!orderId) {
    console.error("Stripe webhook missing order metadata", session.id);
    return;
  }

  if (session.payment_status !== "paid") return;

  await prisma.$transaction(async (transaction) => {
    const order = await transaction.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, paidAt: true, paymentMethod: true },
    });
    if (!order) {
      console.error("Stripe webhook order not found", orderId);
      return;
    }
    if (order.paymentMethod !== "CARD") {
      console.error("Stripe webhook received for a non-card order", order.id);
      return;
    }
    if (order.status === "PAID" || order.paidAt) return;
    if (order.status !== "PENDING") {
      console.error("Stripe payment received for non-pending order", order.id, order.status);
      return;
    }

    const updated = await transaction.order.updateMany({
      where: { id: order.id, status: "PENDING" },
      data: {
        status: "PAID",
        paidAt: new Date(),
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId:
          typeof session.payment_intent === "string" ? session.payment_intent : null,
      },
    });

    if (updated.count !== 1) return;

    await transaction.orderEvent.create({
      data: {
        orderId: order.id,
        fromStatus: "PENDING",
        toStatus: "PAID",
        note: "Card payment confirmed by Stripe.",
      },
    });
  });
}

async function cancelForSession(session: Stripe.Checkout.Session, note: string) {
  const orderId = session.metadata?.orderId;
  if (!orderId) return;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, stripeCheckoutSessionId: true },
  });
  if (!order) return;

  // A retry may have created a newer Checkout Session. Only the session that
  // is still attached to the order may cancel it and release stock.
  if (order.stripeCheckoutSessionId && order.stripeCheckoutSessionId !== session.id) {
    return;
  }

  if (!order.stripeCheckoutSessionId) {
    await prisma.order.updateMany({
      where: { id: orderId, stripeCheckoutSessionId: null },
      data: { stripeCheckoutSessionId: session.id },
    });
  }

  await cancelPendingOrderAndRestock({
    orderId: order.id,
    note,
    stripeCheckoutSessionId: session.id,
  });
}

export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await request.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error("Stripe signature verification failed", error);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await markCardOrderPaid(event.data.object as Stripe.Checkout.Session);
        break;
      case "checkout.session.expired":
        await cancelForSession(
          event.data.object as Stripe.Checkout.Session,
          "Stripe Checkout session expired; stock released.",
        );
        break;
      case "checkout.session.async_payment_failed":
        await cancelForSession(
          event.data.object as Stripe.Checkout.Session,
          "Card payment failed; stock released.",
        );
        break;
      default:
        break;
    }
  } catch (error) {
    console.error("Stripe webhook handling failed", event.type, error);
    return NextResponse.json({ error: "Webhook handling failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
