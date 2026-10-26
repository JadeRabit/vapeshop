"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { AddressForm } from "@/components/account/address-form";
import {
  deleteAddressAction,
  setDefaultAddressAction,
} from "@/lib/actions/addresses";
import type { AddressDTO } from "@/lib/data/account";

function addressLines(address: AddressDTO) {
  return [
    address.line1,
    address.line2,
    address.barangay,
    `${address.city}, ${address.province} ${address.postalCode}`,
    address.country,
  ]
    .filter(Boolean)
    .join(", ");
}

export function AddressManager({ addresses }: { addresses: AddressDTO[] }) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const editing = addresses.find((address) => address.id === editingId) ?? null;
  const deleting = addresses.find((address) => address.id === deletingId) ?? null;

  const handleAddSaved = useCallback(() => {
    setAddOpen(false);
    router.refresh();
  }, [router]);

  const handleEditSaved = useCallback(() => {
    setEditingId(null);
    router.refresh();
  }, [router]);

  function handleSetDefault(addressId: string) {
    startTransition(async () => {
      try {
        const result = await setDefaultAddressAction(addressId);
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        toast.success(result.message);
        router.refresh();
      } catch {
        toast.error("We could not update the default address. Please try again.");
      }
    });
  }

  function handleDelete() {
    if (!deletingId) return;
    const addressId = deletingId;
    startTransition(async () => {
      try {
        const result = await deleteAddressAction(addressId);
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        toast.success(result.message);
        setDeletingId(null);
        router.refresh();
      } catch {
        toast.error("We could not remove that address. Please try again.");
      }
    });
  }

  if (addresses.length === 0) {
    return (
      <>
        <EmptyState
          icon={<MapPin className="size-6" aria-hidden="true" />}
          title="No saved addresses."
          description="Add a Philippine delivery address now, or save one during checkout."
          action={
            <Button type="button" onClick={() => setAddOpen(true)}>
              <Plus aria-hidden="true" /> Add address
            </Button>
          }
        />
        <AddressDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          title="Add delivery address"
          description="We deliver within the Philippines. Use a reachable mobile number."
        >
          <AddressForm submitLabel="Save address" onSaved={handleAddSaved} />
        </AddressDialog>
      </>
    );
  }

  return (
    <>
      <div className="flex justify-end">
        <Button type="button" onClick={() => setAddOpen(true)}>
          <Plus aria-hidden="true" /> Add address
        </Button>
      </div>

      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
        {addresses.map((address) => (
          <li
            key={address.id}
            className="flex flex-col rounded-2xl border border-white/10 bg-card p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="flex items-center gap-2 font-display text-base font-semibold">
                  {address.label || "Delivery address"}
                  {address.isDefault ? <Badge variant="success">Default</Badge> : null}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {address.recipientName} · {address.phone}
                </p>
              </div>
            </div>

            <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">
              {addressLines(address)}
            </p>

            <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-3">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setEditingId(address.id)}
                disabled={isPending}
              >
                <Pencil aria-hidden="true" /> Edit
              </Button>
              {!address.isDefault ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => handleSetDefault(address.id)}
                  disabled={isPending}
                >
                  <Star aria-hidden="true" /> Set default
                </Button>
              ) : null}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setDeletingId(address.id)}
                disabled={isPending}
              >
                <Trash2 aria-hidden="true" /> Delete
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <AddressDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Add delivery address"
        description="We deliver within the Philippines. Use a reachable mobile number."
      >
        <AddressForm submitLabel="Save address" onSaved={handleAddSaved} />
      </AddressDialog>

      <AddressDialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditingId(null);
        }}
        title="Edit delivery address"
        description="Changes apply to future checkouts. Existing orders keep their original snapshot."
      >
        {editing ? <AddressForm address={editing} onSaved={handleEditSaved} /> : null}
      </AddressDialog>

      <Dialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open && !isPending) setDeletingId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove this address?</DialogTitle>
            <DialogDescription>
              {deleting
                ? `${deleting.recipientName}, ${addressLines(deleting)} will be removed from your saved addresses. Past orders are not affected.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingId(null)}
              disabled={isPending}
            >
              Keep address
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? "Removing…" : "Remove address"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AddressDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
