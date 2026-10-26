"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductFormDialog } from "@/components/admin/product-form-dialog";
import type { AdminCategoryDTO } from "@/lib/data/admin-products";

export function NewProductButton({
  categories,
  cloudinaryEnabled,
}: {
  categories: AdminCategoryDTO[];
  cloudinaryEnabled: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus aria-hidden="true" /> Add product
      </Button>
      <ProductFormDialog
        open={open}
        onOpenChange={setOpen}
        categories={categories}
        cloudinaryEnabled={cloudinaryEnabled}
      />
    </>
  );
}
