import { Badge } from "@/components/ui/badge";
import { orderStatusLabels, paymentMethodLabels } from "@/lib/config";
import type { BadgeProps } from "@/components/ui/badge";

const STATUS_VARIANTS: Record<string, BadgeProps["variant"]> = {
  PENDING: "warning",
  PAID: "success",
  SHIPPED: "info",
  DELIVERED: "success",
  CANCELLED: "destructive",
};

export function OrderStatusBadge({
  status,
  className,
}: {
  status: keyof typeof orderStatusLabels;
  className?: string;
}) {
  return (
    <Badge variant={STATUS_VARIANTS[status] ?? "muted"} className={className}>
      {orderStatusLabels[status]}
    </Badge>
  );
}

const PAYMENT_VARIANTS: Record<string, BadgeProps["variant"]> = {
  COD: "muted",
  GCASH: "info",
  CARD: "secondary",
};

export function PaymentMethodBadge({
  paymentMethod,
  className,
}: {
  paymentMethod: keyof typeof paymentMethodLabels;
  className?: string;
}) {
  return (
    <Badge variant={PAYMENT_VARIANTS[paymentMethod] ?? "outline"} className={className}>
      {paymentMethodLabels[paymentMethod]}
    </Badge>
  );
}
