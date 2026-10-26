import { cn } from "@/lib/utils";
import { formatPhp } from "@/lib/money";

export function Price({
  centavos,
  className,
  suffix,
}: {
  centavos: number;
  className?: string;
  suffix?: string;
}) {
  return (
    <span className={cn("tabular-nums", className)}>
      {formatPhp(centavos)}
      {suffix ? <span className="ml-1 text-xs font-normal text-muted-foreground">{suffix}</span> : null}
    </span>
  );
}
