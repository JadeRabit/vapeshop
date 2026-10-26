import Link from "next/link";
import { ArrowLeft, Ghost } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 grid size-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.035]">
          <Ghost className="size-6 text-primary" aria-hidden="true" />
        </div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          404 · Lost in the vapor
        </p>
        <h1 className="text-3xl font-semibold">This page does not exist.</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          The link may be old, or the product may no longer be available. Browse the current
          collection instead.
        </p>
        <Button asChild className="mt-7">
          <Link href="/products">
            <ArrowLeft aria-hidden="true" /> Browse products
          </Link>
        </Button>
      </div>
    </main>
  );
}
