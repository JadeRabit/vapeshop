import Link from "next/link";
import { Search, Sparkles } from "lucide-react";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { AccountMenu } from "@/components/storefront/account-menu";
import { CartTrigger } from "@/components/storefront/cart-trigger";
import { MobileNav } from "@/components/storefront/mobile-nav";
import { siteConfig, storefrontNav } from "@/lib/config";

export async function SiteHeader() {
  const session = await auth();
  const user = session?.user ?? null;

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <MobileNav user={user} />

        <Link href="/" className="flex items-center gap-2.5" aria-label={`${siteConfig.name} home`}>
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[0_0_24px_rgba(196,255,77,.22)]">
            <Sparkles className="size-4" aria-hidden="true" />
          </span>
          <span className="hidden font-display text-base font-semibold tracking-tight sm:block">
            {siteConfig.name}
          </span>
        </Link>

        <nav aria-label="Storefront" className="ml-4 hidden items-center gap-0.5 lg:flex">
          {storefrontNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <Button asChild variant="ghost" size="icon" aria-label="Search products">
            <Link href="/products">
              <Search aria-hidden="true" />
            </Link>
          </Button>
          <AccountMenu user={user} />
          <CartTrigger className="relative" />
        </div>
      </div>
    </header>
  );
}
