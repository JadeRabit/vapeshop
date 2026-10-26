"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function PaymentProcessing({ enabled }: { enabled: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;
    const interval = window.setInterval(() => {
      router.refresh();
    }, 8000);
    return () => window.clearInterval(interval);
  }, [enabled, router]);

  if (!enabled) return null;

  return (
    <p className="flex items-center gap-2 text-xs text-muted-foreground" role="status">
      <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
      Checking for payment confirmation automatically…
    </p>
  );
}
