"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Package, MapPin, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/lib/actions/auth";
import { getInitials } from "@/lib/utils";

type HeaderUser = {
  name?: string | null;
  email?: string | null;
  role?: "ADMIN" | "CUSTOMER";
};

export function AccountMenu({ user }: { user: HeaderUser | null }) {
  const pathname = usePathname();

  if (!user) {
    return (
      <Button asChild variant="ghost" size="sm">
        <Link href={`/login?callbackUrl=${encodeURIComponent(pathname || "/")}`}>
          <UserRound aria-hidden="true" /> Sign in
        </Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label={`Account menu for ${user.name ?? user.email ?? "customer"}`}
        >
          <span className="text-xs font-bold">{getInitials(user.name)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate text-foreground">
          {user.name ?? "Account"}
          <span className="mt-1 block truncate text-[11px] font-normal text-muted-foreground">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account/orders">
            <Package aria-hidden="true" /> Orders
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/addresses">
            <MapPin aria-hidden="true" /> Addresses
          </Link>
        </DropdownMenuItem>
        {user.role === "ADMIN" ? (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <ShieldCheck aria-hidden="true" /> Admin console
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <form action={signOutAction}>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full text-destructive">
              <LogOut aria-hidden="true" /> Sign out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
