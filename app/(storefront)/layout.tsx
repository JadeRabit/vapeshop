import { cookies } from "next/headers";
import { AgeGate } from "@/components/storefront/age-gate";
import { CartProvider } from "@/components/storefront/cart-ui";
import { SiteFooter } from "@/components/storefront/footer";
import { SiteHeader } from "@/components/storefront/header";
import { isAgeVerificationValid } from "@/lib/age-verification";
import { siteConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const initiallyVerified = isAgeVerificationValid(
    cookieStore.get(siteConfig.ageCookieName)?.value,
  );

  return (
    <CartProvider>
      <AgeGate initiallyVerified={initiallyVerified} />
      <div className="flex min-h-dvh flex-col">
        <SiteHeader />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </div>
    </CartProvider>
  );
}
