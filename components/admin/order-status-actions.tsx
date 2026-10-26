"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, PackageCheck, Truck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updateOrderStatusAction } from "@/lib/actions/admin-orders";
import { initialOrderState } from "@/lib/action-result";
import { getAllowedAdminTransitions, type OrderStatusValue } from "@/lib/order-state";

const STATUS_ICONS = {
  PAID: CheckCircle2,
  SHIPPED: Truck,
  DELIVERED: PackageCheck,
  CANCELLED: XCircle,
} as const;

const STATUS_LABELS: Record<OrderStatusValue, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export function OrderStatusActions({
  orderNumber,
  status,
  paymentMethod,
  paymentReference,
  hasPaymentProof,
}: {
  orderNumber: string;
  status: OrderStatusValue;
  paymentMethod: "COD" | "GCASH" | "CARD";
  paymentReference: string | null;
  hasPaymentProof: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<OrderStatusValue | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const allowed = getAllowedAdminTransitions({
    status,
    paymentMethod,
    paymentReference,
    paymentProofId: hasPaymentProof ? "available" : null,
  });

  function submit(nextStatus: OrderStatusValue) {
    setError(null);
    setPendingStatus(nextStatus);
    const formData = new FormData();
    formData.set("orderNumber", orderNumber);
    formData.set("status", nextStatus);

    startTransition(async () => {
      try {
        const result = await updateOrderStatusAction(initialOrderState, formData);
        if (!result.ok) {
          setError(result.message ?? "The status could not be updated.");
          toast.error(result.message ?? "The status could not be updated.");
          return;
        }
        toast.success(result.message ?? "Order updated.");
        setCancelOpen(false);
        router.refresh();
      } catch {
        setError("The status could not be updated. Please try again.");
        toast.error("The status could not be updated.");
      } finally {
        setPendingStatus(null);
      }
    });
  }

  return (
    <div className="space-y-3">
      {error ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {allowed.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs leading-5 text-muted-foreground">
          No further status changes are available for this order.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {allowed.map((transition) => {
            const Icon = STATUS_ICONS[transition.value as keyof typeof STATUS_ICONS];
            const destructive = transition.value === "CANCELLED";
            return (
              <Button
                key={transition.value}
                type="button"
                variant={destructive ? "outline" : "default"}
                size="sm"
                className={
                  destructive
                    ? "border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    : undefined
                }
                disabled={isPending}
                onClick={() => {
                  if (destructive) {
                    setCancelOpen(true);
                  } else {
                    submit(transition.value);
                  }
                }}
              >
                {pendingStatus === transition.value ? (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                ) : Icon ? (
                  <Icon aria-hidden="true" />
                ) : null}
                Mark {transition.label.toLowerCase()}
              </Button>
            );
          })}
        </div>
      )}

      {status === "PENDING" && paymentMethod === "GCASH" ? (
        <p className="text-xs leading-5 text-muted-foreground">
          {hasPaymentProof && paymentReference
            ? "Verify the GCash receipt and reference before marking this order paid."
            : "A GCash reference and uploaded receipt are required before this order can be marked paid."}
        </p>
      ) : null}
      {status === "PENDING" && paymentMethod === "CARD" ? (
        <p className="text-xs leading-5 text-muted-foreground">
          Card payments are confirmed only by the signed Stripe webhook. Manual paid changes are
          blocked.
        </p>
      ) : null}
      {status === "PENDING" && paymentMethod === "COD" ? (
        <p className="text-xs leading-5 text-muted-foreground">
          COD orders can ship before cash collection. Confirming delivery records cash as collected.
        </p>
      ) : null}

      <Dialog open={cancelOpen} onOpenChange={(open) => !isPending && setCancelOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel {orderNumber}?</DialogTitle>
            <DialogDescription>
              Cancelling restores every reserved item to stock and is final. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCancelOpen(false)}
              disabled={isPending}
            >
              Keep order
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => submit("CANCELLED")}
              disabled={isPending}
            >
              {isPending && pendingStatus === "CANCELLED" ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : null}
              Cancel order and restore stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <p className="text-[11px] text-muted-foreground">
        Current status: {STATUS_LABELS[status]}. Every change is recorded in the order timeline.
      </p>
    </div>
  );
}
