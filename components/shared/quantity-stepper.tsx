"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function QuantityStepper({
  value,
  onDecrease,
  onIncrease,
  min = 1,
  max = 99,
  label = "Quantity",
  size = "default",
  className,
}: {
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  min?: number;
  max?: number;
  label?: string;
  size?: "sm" | "default";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-white/12 bg-white/[0.03]",
        className,
      )}
      role="group"
      aria-label={label}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="rounded-full"
        onClick={onDecrease}
        disabled={value <= min}
        aria-label={`Decrease ${label.toLowerCase()}`}
      >
        <Minus aria-hidden="true" />
      </Button>
      <span
        className={cn("min-w-8 text-center text-sm font-semibold tabular-nums", size === "sm" && "text-xs")}
        aria-live="polite"
      >
        {value}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="rounded-full"
        onClick={onIncrease}
        disabled={value >= max}
        aria-label={`Increase ${label.toLowerCase()}`}
      >
        <Plus aria-hidden="true" />
      </Button>
    </div>
  );
}
