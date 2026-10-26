"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProductFormDialog } from "@/components/admin/product-form-dialog";
import { StockAdjuster } from "@/components/admin/stock-adjuster";
import {
  archiveProductAction,
  deleteProductAction,
} from "@/lib/actions/admin-products";
import type { AdminCategoryDTO, AdminProductDTO } from "@/lib/data/admin-products";

export function ProductRowActions({
  product,
  categories,
  cloudinaryEnabled,
}: {
  product: AdminProductDTO;
  categories: AdminCategoryDTO[];
  cloudinaryEnabled: boolean;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleArchive() {
    startTransition(async () => {
      const result = await archiveProductAction(product.id);
      if (!result.ok) {
        toast.error(result.message ?? "Could not archive the product.");
        return;
      }
      toast.success(result.message ?? "Product archived.");
      router.refresh();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteProductAction(product.id);
      if (!result.ok) {
        toast.error(result.message ?? "Could not delete the product.");
        return;
      }
      toast.success(result.message ?? "Product deleted.");
      setDeleteOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      <Button type="button" variant="outline" size="sm" onClick={() => setEditOpen(true)}>
        <Pencil aria-hidden="true" /> Edit
      </Button>
      <StockAdjuster product={product} />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`More actions for ${product.name}`}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <MoreHorizontal aria-hidden="true" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onSelect={handleArchive}
            disabled={!product.isActive && !product.variants.some((variant) => variant.isActive)}
          >
            <Archive aria-hidden="true" /> Archive
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={() => setDeleteOpen(true)}
          >
            <Trash2 aria-hidden="true" /> Delete permanently
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProductFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        categories={categories}
        product={product}
        cloudinaryEnabled={cloudinaryEnabled}
      />

      <Dialog open={deleteOpen} onOpenChange={(open) => !isPending && setDeleteOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {product.name}?</DialogTitle>
            <DialogDescription>
              This permanently removes the product, its variants, reviews, and image links. Products
              with order history cannot be deleted; archive them instead.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? "Deleting…" : "Delete product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
