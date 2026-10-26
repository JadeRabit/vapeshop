import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { getSessionUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { getAddresses } from "@/lib/data/account";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckoutWizard } from "@/components/checkout/checkout-wizard";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your Vapor District order.",
  robots: { index: false, follow: false },
};

type CheckoutPageProps = {
  searchParams: Promise<{ cancelled?: string }>;
};

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    redirect("/login?callbackUrl=/checkout");
  }

  const [addresses, user, params] = await Promise.all([
    getAddresses(sessionUser.id),
    prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { name: true, email: true },
    }),
    searchParams,
  ]);

  if (!user) {
    redirect("/login?callbackUrl=/checkout");
  }

  return (
    <>
      {params.cancelled === "1" ? (
        <div className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6 lg:px-8">
          <Alert variant="warning">
            <AlertCircle aria-hidden="true" />
            <AlertDescription>
              Card payment was cancelled. Your cart is still here — review the order and try again
              when ready.
            </AlertDescription>
          </Alert>
        </div>
      ) : null}
      <CheckoutWizard
        user={{ name: user.name, email: user.email }}
        addresses={addresses}
        cloudinaryEnabled={env.isCloudinaryConfigured}
        stripeEnabled={env.isStripeConfigured}
      />
    </>
  );
}
