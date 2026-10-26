"use client";

import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StorefrontError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void error;

  return (
    <div className="mx-auto flex min-h-[60dvh] w-full max-w-lg flex-col items-center justify-center px-4 text-center">
      <span className="grid size-14 place-items-center rounded-2xl border border-destructive/30 bg-destructive/10 text-destructive">
        <AlertTriangle className="size-6" aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-2xl font-semibold sm:text-3xl">This shelf could not be loaded.</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Check your connection and try again. Your cart and account data are safe.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Button type="button" onClick={reset}>
          <RotateCcw aria-hidden="true" /> Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Back to store</Link>
        </Button>
      </div>
    </div>
  );
}
