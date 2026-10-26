import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  hint,
  icon,
  href,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint: string;
  icon: ReactNode;
  href?: string;
  tone?: "default" | "warning";
}) {
  const content = (
    <Card
      className={cn(
        "h-full p-5 transition-colors",
        href ? "hover:border-primary/30 hover:bg-white/[0.035]" : null,
        tone === "warning" ? "border-amber-300/20" : null,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="grid size-9 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-primary">
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
