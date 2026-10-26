"use client";

import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 grid size-14 place-items-center rounded-2xl border border-destructive/30 bg-destructive/10">
          <AlertTriangle className="size-6 text-destructive" aria-hidden="true" />
        </div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          Unexpected error
        </p>
        <h1 className="text-3xl font-semibold">Something went off the rails.</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          We could not complete that request. Your cart and account data are safe. Try again, or
          head back to the storefront.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button onClick={reset}>
            <RotateCcw aria-hidden="true" /> Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Back to store</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
