"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Boxes, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updateStockAction } from "@/lib/actions/admin-products";
import { initialStockState, type StockActionState } from "@/lib/action-result";
import type { AdminProductDTO, AdminProductVariantDTO } from "@/lib/data/admin-products";
import { useActionState } from "react";

function StockRow({ variant }: { variant: AdminProductVariantDTO }) {
  const router = useRouter();
  const prefix = useId().replace(/[:]/g, "");
  const [state, formAction, pending] = useActionState<StockActionState, FormData>(
    updateStockAction,
    initialStockState,
  );

  useEffect(() => {
    if (state.ok) {
      toast.success(state.message ?? "Stock updated.");
      router.refresh();
    }
  }, [state, router]);

  const isLow = variant.stock <= variant.lowStockThreshold;

  return (
    <form
      action={formAction}
      className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 sm:grid-cols-[1fr_100px_110px_auto] sm:items-end"
    >
      <input type="hidden" name="variantId" value={variant.id} />
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
          {variant.label}
          {isLow ? (
            <Badge variant={variant.stock === 0 ? "destructive" : "warning"}>
              {variant.stock === 0 ? "Out of stock" : "Low stock"}
            </Badge>
          ) : null}
          {!variant.isActive ? <Badge variant="muted">Inactive</Badge> : null}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{variant.sku}</p>
        {state.message && !state.ok ? (
          <p className="mt-1 text-xs text-destructive" role="alert">
            {state.message}
          </p>
        ) : null}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${prefix}-stock`} className="text-[11px] text-muted-foreground">
          Stock
        </Label>
        <Input
          id={`${prefix}-stock`}
          name="stock"
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          defaultValue={variant.stock}
          aria-invalid={Boolean(state.fieldErrors?.stock)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${prefix}-threshold`} className="text-[11px] text-muted-foreground">
          Low at
        </Label>
        <Input
          id={`${prefix}-threshold`}
          name="lowStockThreshold"
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          defaultValue={variant.lowStockThreshold}
          aria-invalid={Boolean(state.fieldErrors?.lowStockThreshold)}
        />
      </div>
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
        Save
      </Button>
    </form>
  );
}

export function StockAdjuster({ product }: { product: AdminProductDTO }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Boxes aria-hidden="true" /> Stock
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Inventory · {product.name}</DialogTitle>
          <DialogDescription>
            Adjust whole-unit stock and the low-stock threshold. Quantities cannot go below zero.
          </DialogDescription>
        </DialogHeader>

        {product.variants.length === 0 ? (
          <p className="text-sm text-muted-foreground">This product has no variants yet.</p>
        ) : (
          <div className="space-y-2">
            {product.variants.map((variant) => (
              <StockRow key={variant.id} variant={variant} />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
