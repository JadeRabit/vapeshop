"use client";

import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function QuantityStepper({
  value,
  onDecrease,
  onIncrease,
  onChange,
  min = 1,
  max = 99,
  label = "Quantity",
  size = "default",
  className,
}: {
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  /** Called when the customer types a quantity directly. */
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
  size?: "sm" | "default";
  className?: string;
}) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  function commit(raw: string) {
    const parsed = Number(raw);
    if (raw.trim() === "" || !Number.isFinite(parsed)) {
      setDraft(String(value));
      return;
    }
    const next = Math.min(Math.max(Math.floor(parsed), min), max);
    setDraft(String(next));
    if (next !== value) onChange?.(next);
  }

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
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={draft}
        onChange={(event) => {
          const raw = event.target.value;
          setDraft(raw);
          if (raw.trim() === "") return;
          const parsed = Number(raw);
          if (!Number.isFinite(parsed)) return;
          const next = Math.min(Math.max(Math.floor(parsed), min), max);
          if (next !== value) onChange?.(next);
        }}
        onBlur={(event) => commit(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit(event.currentTarget.value);
          }
        }}
        aria-label={label}
        className={cn(
          "h-7 w-12 rounded-full bg-transparent text-center text-sm font-semibold tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          size === "sm" && "text-xs",
        )}
      />
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
