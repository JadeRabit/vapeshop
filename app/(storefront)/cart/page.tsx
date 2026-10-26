import type { Metadata } from "next";
import { auth } from "@/auth";
import { CartPage } from "@/components/storefront/cart-page";

export const metadata: Metadata = {
  title: "Cart",
  description: "Review your Vapor District cart before checkout.",
  robots: { index: false, follow: false },
};

export default async function CartRoute() {
  const session = await auth();
  return <CartPage isAuthenticated={Boolean(session?.user)} />;
}
