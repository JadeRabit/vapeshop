"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, MapPin, Menu, Package, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { signOutAction } from "@/lib/actions/auth";
import { storefrontNav, siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";

type MobileNavUser = {
  name?: string | null;
  email?: string | null;
  role?: "ADMIN" | "CUSTOMER";
};

export function MobileNav({ user }: { user: MobileNavUser | null }) {
  const pathname = usePathname();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation menu">
          <Menu aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full sm:max-w-sm">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="size-4" aria-hidden="true" />
            </span>
            {siteConfig.name}
          </SheetTitle>
          <SheetDescription>21+ storefront navigation</SheetDescription>
        </SheetHeader>

        <nav aria-label="Mobile storefront" className="flex flex-col gap-1">
          {storefrontNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-xl px-3 py-3 text-base font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground",
                pathname === item.href && "bg-white/5 text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/products?category=coils-accessories"
            className="rounded-xl px-3 py-3 text-base font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
          >
            Coils & Accessories
          </Link>
        </nav>

        <div className="my-2 h-px bg-border" />

        {user ? (
          <div className="space-y-1">
            <p className="px-3 pb-2 text-xs text-muted-foreground">
              Signed in as {user.name ?? user.email}
            </p>
            <Link
              href="/account/orders"
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground"
            >
              <Package className="size-4" aria-hidden="true" /> Orders
            </Link>
            <Link
              href="/account/addresses"
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground"
            >
              <MapPin className="size-4" aria-hidden="true" /> Addresses
            </Link>
            {user.role === "ADMIN" ? (
              <Link
                href="/admin"
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-primary hover:bg-white/5"
              >
                <ShieldCheck className="size-4" aria-hidden="true" /> Admin console
              </Link>
            ) : null}
          </div>
        ) : null}

        <SheetFooter>
          {user ? (
            <form action={signOutAction}>
              <Button type="submit" variant="outline" className="w-full justify-start">
                <LogOut aria-hidden="true" /> Sign out
              </Button>
            </form>
          ) : (
            <Button asChild>
              <Link href={`/login?callbackUrl=${encodeURIComponent(pathname || "/")}`}>
                <UserRound aria-hidden="true" /> Sign in
              </Link>
            </Button>
          )}
          <p className="pt-2 text-xs leading-5 text-muted-foreground">
            You must be 21 or older. Nicotine is an addictive chemical.
          </p>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
