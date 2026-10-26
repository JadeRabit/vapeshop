import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-xl border px-4 py-3 text-sm [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:size-4 [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "border-white/10 bg-white/[0.035] text-foreground",
        destructive: "border-destructive/30 bg-destructive/10 text-destructive",
        warning: "border-amber-300/25 bg-amber-300/10 text-amber-100",
        success: "border-emerald-400/25 bg-emerald-400/10 text-emerald-100",
        info: "border-cyan-300/25 bg-cyan-300/10 text-cyan-50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return <div role="alert" className={cn(alertVariants({ variant }), className)} {...props} />;
}

function AlertTitle({ className, ...props }: React.ComponentProps<"h5">) {
  return <h5 className={cn("mb-1 font-medium leading-none", className)} {...props} />;
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("text-sm leading-6 opacity-90", className)} {...props} />;
}

export { Alert, AlertTitle, AlertDescription };
