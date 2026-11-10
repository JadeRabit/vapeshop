import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StockBadgeProps = {
  stock: number;
  threshold?: number;
  inactive?: boolean;
  preOrder?: boolean;
  className?: string;
};

export function StockBadge({
  stock,
  threshold = 5,
  inactive,
  preOrder,
  className,
}: StockBadgeProps) {
  if (inactive) {
    return (
      <Badge variant="muted" className={className}>
        Unavailable
      </Badge>
    );
  }

  if (stock <= 0) {
    return (
      <Badge variant={preOrder ? "info" : "destructive"} className={className}>
        {preOrder ? "Pre-order" : "Out of stock"}
      </Badge>
    );
  }

  if (stock <= threshold) {
    return (
      <Badge variant="warning" className={cn(className)}>
        Only {stock} left
      </Badge>
    );
  }

  return (
    <Badge variant="success" className={className}>
      In stock
    </Badge>
  );
}
