"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Users,
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
import { RefreshButton } from "@/components/admin/refresh-button";
import { signOutAction } from "@/lib/actions/auth";
import { getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

type AdminNavBadge = "pending" | "lowStock";

type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  badge?: AdminNavBadge;
};

type AdminNavGroup = {
  label: string;
  items: AdminNavItem[];
};

const adminNavGroups: AdminNavGroup[] = [
  {
    label: "Operations",
    items: [
      { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
      { href: "/admin/orders", label: "Orders", icon: ShoppingBag, badge: "pending" },
      { href: "/admin/customers", label: "Customers", icon: Users },
    ],
  },
  {
    label: "Catalogue",
    items: [
      { href: "/admin/products", label: "Products", icon: Package, badge: "lowStock" },
      { href: "/admin/reviews", label: "Reviews", icon: Star },
    ],
  },
];

const segmentLabels: Record<string, string> = {
  admin: "Overview",
  products: "Products",
  orders: "Orders",
  customers: "Customers",
  reviews: "Reviews",
};

export type AdminShellBadges = {
  pendingOrders: number;
  lowStock: number;
  needsAttention: number;
};

type AdminShellUser = {
  name: string | null;
  email: string;
};

function NavBadge({
  kind,
  count,
}: {
  kind: AdminNavBadge;
  count: number;
}) {
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        "ml-auto inline-flex min-w-5 items-center justify-center rounded-full border px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
        kind === "lowStock"
          ? "border-amber-300/25 bg-amber-300/10 text-amber-200"
          : "border-primary/25 bg-primary/10 text-primary",
      )}
      aria-label={kind === "lowStock" ? `${count} low stock` : `${count} pending`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

function NavLinks({
  pathname,
  badges,
  onNavigate,
}: {
  pathname: string;
  badges: AdminShellBadges;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Admin" className="flex flex-col gap-5">
      {adminNavGroups.map((group) => (
        <div key={group.label} className="space-y-1">
          <p className="px-3.5 text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground/70">
            {group.label}
          </p>
          {group.items.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            const badgeCount =
              item.badge === "pending"
                ? badges.pendingOrders
                : item.badge === "lowStock"
                  ? badges.lowStock
                  : 0;
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
                {item.badge ? <NavBadge kind={item.badge} count={badgeCount} /> : null}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function SidebarContent({
  pathname,
  user,
  badges,
  onNavigate,
}: {
  pathname: string;
  user: AdminShellUser;
  badges: AdminShellBadges;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col gap-6">
      <Link href="/admin" className="flex items-center gap-2.5" onClick={onNavigate}>
        <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[0_0_24px_rgba(196,255,77,.2)]">
          <Sparkles className="size-4" aria-hidden="true" />
        </span>
        <span>
          <span className="block font-display text-sm font-semibold">Vapor District</span>
          <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Admin console
          </span>
        </span>
      </Link>

      <NavLinks pathname={pathname} badges={badges} onNavigate={onNavigate} />

      {badges.needsAttention > 0 ? (
        <Link
          href="/admin/orders?status=PENDING"
          onClick={onNavigate}
          className="rounded-xl border border-amber-300/20 bg-amber-300/[0.05] p-3 text-xs leading-5 text-amber-100 transition-colors hover:border-amber-300/35"
        >
          <span className="flex items-center gap-1.5 font-semibold">
            <span className="size-1.5 rounded-full bg-amber-300 shadow-[0_0_10px_rgba(252,211,77,.8)]" />
            {badges.needsAttention} order{badges.needsAttention === 1 ? "" : "s"} need attention
          </span>
          <span className="mt-0.5 block text-[11px] text-amber-200/70">
            Missing GCash proof or waiting over 24 hours.
          </span>
        </Link>
      ) : null}

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
            <p className="truncate text-[11px] text-muted-foreground" title={user.email}>
              {user.email}
            </p>
          </div>
        </div>

        <form action={signOutAction}>
          <Button type="submit" variant="outline" className="w-full justify-start">
            <LogOut aria-hidden="true" /> Sign out
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
    const previous = segments[index - 1];
    const label =
      previous === "orders" && segment !== "orders"
        ? `Order ${decodeURIComponent(segment)}`
        : segmentLabels[segment] ?? decodeURIComponent(segment);
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
  badges,
  children,
}: {
  user: AdminShellUser;
  badges: AdminShellBadges;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-background lg:grid lg:grid-cols-[260px_1fr]">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <aside className="sticky top-0 hidden h-dvh border-r border-white/10 bg-[#0a0a11] p-5 lg:flex">
        <SidebarContent pathname={pathname} user={user} badges={badges} />
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/10 bg-background/85 px-4 backdrop-blur-xl sm:px-6">
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open admin menu">
                <Menu aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[290px] bg-[#0a0a11] p-5">
              <SheetHeader className="sr-only">
                <SheetTitle>Admin menu</SheetTitle>
                <SheetDescription>Navigate the admin console.</SheetDescription>
              </SheetHeader>
              <SidebarContent
                pathname={pathname}
                user={user}
                badges={badges}
                onNavigate={() => setMobileNavOpen(false)}
              />
            </SheetContent>
          </Sheet>

          <Breadcrumbs pathname={pathname} />

          <div className="ml-auto flex items-center gap-1">
            <RefreshButton />
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/" target="_blank" rel="noreferrer">
                Storefront <ExternalLink aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </header>

        <main id="admin-main" className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
