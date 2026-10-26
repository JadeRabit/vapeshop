"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, Package, ShieldCheck, Store } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
] as const;

export function AccountNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Account" className="flex gap-2 overflow-x-auto lg:flex-col">
      {links.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors",
              active
                ? "border-primary/30 bg-primary/[0.07] text-primary"
                : "border-transparent text-muted-foreground hover:border-white/10 hover:bg-white/[0.04] hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {link.label}
          </Link>
        );
      })}
      <Link
        href="/products"
        className="flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
      >
        <Store className="size-4" aria-hidden="true" />
        Storefront
      </Link>
      {isAdmin ? (
        <Link
          href="/admin"
          className="flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
        >
          <ShieldCheck className="size-4" aria-hidden="true" />
          Admin console
        </Link>
      ) : null}
    </nav>
  );
}
