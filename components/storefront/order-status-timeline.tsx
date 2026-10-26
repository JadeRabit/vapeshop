import { Check, Clock, Package, Truck, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/utils";

const STATUS_META = {
  PENDING: { label: "Order placed", icon: Clock },
  PAID: { label: "Payment confirmed", icon: Check },
  SHIPPED: { label: "Shipped", icon: Truck },
  DELIVERED: { label: "Delivered", icon: Package },
  CANCELLED: { label: "Cancelled", icon: XCircle },
} as const;

export function OrderStatusTimeline({
  events,
}: {
  events: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    note: string | null;
    createdAt: string;
  }>;
}) {
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">No status events recorded yet.</p>;
  }

  return (
    <ol className="space-y-0">
      {events.map((event, index) => {
        const meta = STATUS_META[event.toStatus as keyof typeof STATUS_META] ?? STATUS_META.PENDING;
        const Icon = meta.icon;
        return (
          <li key={event.id} className="relative flex gap-3 pb-6 last:pb-0">
            {index < events.length - 1 ? (
              <span className="absolute left-[15px] top-8 h-full w-px bg-white/10" aria-hidden="true" />
            ) : null}
            <span
              className={cn(
                "relative z-10 grid size-8 shrink-0 place-items-center rounded-full border",
                event.toStatus === "CANCELLED"
                  ? "border-destructive/30 bg-destructive/10 text-destructive"
                  : "border-primary/30 bg-primary/10 text-primary",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-sm font-semibold">{meta.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{formatDateTime(event.createdAt)}</p>
              {event.note ? (
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{event.note}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
