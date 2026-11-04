"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteReviewAction } from "@/lib/actions/admin-reviews";

export function ReviewRowActions({
  reviewId,
  productName,
  customerEmail,
}: {
  reviewId: string;
  productName: string;
  customerEmail: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteReviewAction(reviewId);
      if (!result.ok) {
        toast.error(result.message ?? "Could not remove the review.");
        return;
      }
      toast.success(result.message ?? "Review removed.");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-destructive"
        onClick={() => setOpen(true)}
        aria-label={`Remove review for ${productName}`}
      >
        <Trash2 aria-hidden="true" /> Remove
      </Button>

      <Dialog open={open} onOpenChange={(next) => !isPending && setOpen(next)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove this review?</DialogTitle>
            <DialogDescription>
              The review for {productName} by {customerEmail} will be permanently deleted from the
              storefront. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Keep review
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
              Remove review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
