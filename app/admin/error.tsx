"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin console error", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60dvh] max-w-lg flex-col items-center justify-center text-center">
      <span className="grid size-14 place-items-center rounded-2xl border border-destructive/25 bg-destructive/10 text-destructive">
        <AlertTriangle className="size-6" aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-2xl font-semibold">Something went wrong in the admin console.</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        The data could not be loaded. Retry the request, or return to the overview.
      </p>
      <Button type="button" onClick={reset} className="mt-6">
        <RotateCcw aria-hidden="true" /> Try again
      </Button>
    </div>
  );
}
