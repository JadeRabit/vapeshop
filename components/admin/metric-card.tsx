import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MetricTrend = {
  value: number | null;
  label?: string;
};

export function MetricCard({
  label,
  value,
  hint,
  icon,
  href,
  tone = "default",
  trend,
}: {
  label: string;
  value: ReactNode;
  hint: string;
  icon: ReactNode;
  href?: string;
  tone?: "default" | "warning" | "danger";
  trend?: MetricTrend;
}) {
  const content = (
    <Card
      className={cn(
        "h-full p-5 transition-colors",
        href ? "hover:border-primary/30 hover:bg-white/[0.035]" : null,
        tone === "warning" ? "border-amber-300/20" : null,
        tone === "danger" ? "border-destructive/25" : null,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "grid size-9 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-primary",
            tone === "warning" && "border-amber-300/20 bg-amber-300/[0.07] text-amber-200",
            tone === "danger" && "border-destructive/20 bg-destructive/10 text-destructive",
          )}
        >
          {icon}
        </div>
        {href ? (
          <ArrowUpRight className="size-4 text-muted-foreground" aria-hidden="true" />
        ) : null}
      </div>
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {trend ? (
        <p className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] font-medium">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 tabular-nums",
              trend.value === null
                ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-200"
                : trend.value >= 0
                  ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                  : "border-destructive/20 bg-destructive/10 text-destructive",
            )}
          >
            {trend.value === null ? (
              <Minus className="size-3" aria-hidden="true" />
            ) : trend.value >= 0 ? (
              <ArrowUpRight className="size-3" aria-hidden="true" />
            ) : (
              <ArrowDownRight className="size-3" aria-hidden="true" />
            )}
            {trend.value === null ? "New" : `${Math.abs(trend.value)}%`}
          </span>
          <span className="text-muted-foreground">{trend.label ?? "vs prior 30 days"}</span>
        </p>
      ) : null}
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{hint}</p>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full rounded-2xl">
        {content}
      </Link>
    );
  }

  return content;
}
