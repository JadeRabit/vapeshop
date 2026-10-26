import "server-only";
import Stripe from "stripe";
import { env } from "@/lib/env";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (!env.STRIPE_SECRET_KEY) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
}

export const cardPaymentsEnabled = Boolean(env.STRIPE_SECRET_KEY);

type CheckoutOrder = {
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
};

export async function retrieveCheckoutSession(sessionId: string) {
  const stripe = getStripe();
  if (!stripe) return null;
  return stripe.checkout.sessions.retrieve(sessionId);
}

export async function createOrderCheckoutSession(order: CheckoutOrder) {
  const stripe = getStripe();
  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = order.items.map((item) => ({
    quantity: item.quantity,
    price_data: {
      currency: "php",
      unit_amount: item.unitPriceCentavos,
      product_data: {
        name: `${item.productName} — ${item.variantLabel}`.slice(0, 120),
      },
    },
  }));

  if (order.shippingCentavos > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "php",
        unit_amount: order.shippingCentavos,
        product_data: { name: "Shipping" },
      },
    });
  }

  return stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: order.contactEmail,
    client_reference_id: order.orderNumber,
    line_items: lineItems,
    metadata: {
      orderId: order.id,
      orderNumber: order.orderNumber,
    },
    payment_intent_data: {
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
    },
    expires_at: Math.floor(Date.now() / 1000) + 31 * 60,
    success_url: `${env.appUrl}/checkout/success/${order.orderNumber}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.appUrl}/checkout?cancelled=1`,
  });
}
