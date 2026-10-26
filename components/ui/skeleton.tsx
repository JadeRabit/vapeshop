import type * as React from "react";
import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-white/[0.07]", className)}
      aria-hidden="true"
      {...props}
    />
  );
}

export { Skeleton };
