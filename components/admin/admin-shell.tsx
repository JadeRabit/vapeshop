"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ExternalLink,
  LayoutDashboard,
  Menu,
  Package,
  ShoppingBag,
  Sparkles,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { signOutAction } from "@/lib/actions/auth";
import { getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

const adminNav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
] as const;

const segmentLabels: Record<string, string> = {
  admin: "Overview",
  products: "Products",
  orders: "Orders",
};

type AdminShellUser = {
  name: string | null;
  email: string;
};

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Admin" className="flex flex-col gap-1">
      {adminNav.map((item) => {
        const active =
          "exact" in item && item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-colors",
              active
                ? "border-primary/30 bg-primary/[0.07] text-primary"
                : "border-transparent text-muted-foreground hover:border-white/10 hover:bg-white/[0.04] hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContent({
  pathname,
  user,
  onNavigate,
}: {
  pathname: string;
  user: AdminShellUser;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col gap-6">
      <Link href="/admin" className="flex items-center gap-2.5" onClick={onNavigate}>
        <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
          <Sparkles className="size-4" aria-hidden="true" />
        </span>
        <span>
          <span className="block font-display text-sm font-semibold">Vapor District</span>
          <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Admin console
          </span>
        </span>
      </Link>

      <NavLinks pathname={pathname} onNavigate={onNavigate} />

      <div className="mt-auto space-y-3 border-t border-white/10 pt-4">
        <Link
          href="/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
          onClick={onNavigate}
        >
          <Store className="size-4" aria-hidden="true" />
          View storefront
          <ExternalLink className="ml-auto size-3.5" aria-hidden="true" />
        </Link>

        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full border border-primary/25 bg-primary/10 text-xs font-bold text-primary">
            {getInitials(user.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user.name ?? "Administrator"}</p>
            <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <form action={signOutAction}>
          <Button type="submit" variant="outline" className="w-full justify-start">
            Sign out
          </Button>
        </form>
      </div>
    </div>
  );
}

function Breadcrumbs({ pathname }: { pathname: string }) {
  const segments = pathname.split("/").filter(Boolean);
  const trail: Array<{ href: string; label: string }> = [];
  let accumulated = "";

  for (const [index, segment] of segments.entries()) {
    accumulated += `/${segment}`;
    const label = segmentLabels[segment] ?? decodeURIComponent(segment);
    if (index === 0) {
      trail.push({ href: "/admin", label: "Overview" });
      if (segments.length === 1) break;
      continue;
    }
    trail.push({ href: accumulated, label });
  }

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex items-center gap-1.5 overflow-hidden text-xs text-muted-foreground">
        {trail.map((crumb, index) => {
          const last = index === trail.length - 1;
          return (
            <li key={crumb.href} className="flex min-w-0 items-center gap-1.5">
              {index > 0 ? <span aria-hidden="true">/</span> : null}
              {last ? (
                <span className="truncate font-medium text-foreground" aria-current="page">
                  {crumb.label}
                </span>
              ) : (
                <Link href={crumb.href} className="truncate hover:text-foreground">
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function AdminShell({
  user,
  children,
}: {
  user: AdminShellUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-background lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="sticky top-0 hidden h-dvh border-r border-white/10 bg-card p-5 lg:flex">
        <SidebarContent pathname={pathname} user={user} />
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-white/10 bg-background/85 px-4 backdrop-blur-xl sm:px-6">
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open admin menu">
                <Menu aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px]">
              <SheetHeader className="sr-only">
                <SheetTitle>Admin menu</SheetTitle>
                <SheetDescription>Navigate the admin console.</SheetDescription>
              </SheetHeader>
              <SidebarContent
                pathname={pathname}
                user={user}
                onNavigate={() => setMobileNavOpen(false)}
              />
            </SheetContent>
          </Sheet>

          <Breadcrumbs pathname={pathname} />

          <Button asChild variant="ghost" size="sm" className="ml-auto hidden sm:inline-flex">
            <Link href="/" target="_blank" rel="noreferrer">
              Storefront <ExternalLink aria-hidden="true" />
            </Link>
          </Button>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
