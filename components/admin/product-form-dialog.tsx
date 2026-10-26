"use client";

import { useEffect, useId, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ImageOff,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductImageUploader } from "@/components/admin/product-image-uploader";
import { createProductAction, updateProductAction } from "@/lib/actions/admin-products";
import { initialProductState, type ProductActionState } from "@/lib/action-result";
import type {
  AdminCategoryDTO,
  AdminProductDTO,
  AdminProductVariantDTO,
} from "@/lib/data/admin-products";
import { flavorProfiles } from "@/lib/config";
import { slugify } from "@/lib/utils";
import { useActionState } from "react";

type VariantDraft = {
  key: string;
  id?: string;
  label: string;
  sku: string;
  flavorProfile: string;
  nicotineMg: string;
  color: string;
  pricePesos: string;
  stock: string;
  lowStockThreshold: string;
  isActive: boolean;
};

type ImageDraft = {
  key: string;
  mediaId: string;
  url: string | null;
  alt: string;
  variantId: string;
};

function draftKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `draft-${Math.random().toString(36).slice(2)}`;
}

function emptyVariant(): VariantDraft {
  return {
    key: draftKey(),
    label: "",
    sku: "",
    flavorProfile: "",
    nicotineMg: "",
    color: "",
    pricePesos: "",
    stock: "0",
    lowStockThreshold: "5",
    isActive: true,
  };
}

function variantFromDTO(variant: AdminProductVariantDTO): VariantDraft {
  return {
    key: draftKey(),
    id: variant.id,
    label: variant.label,
    sku: variant.sku,
    flavorProfile: variant.flavorProfile ?? "",
    nicotineMg: variant.nicotineMg === null ? "" : String(variant.nicotineMg),
    color: variant.color ?? "",
    pricePesos: (variant.priceCentavos / 100).toFixed(2),
    stock: String(variant.stock),
    lowStockThreshold: String(variant.lowStockThreshold),
    isActive: variant.isActive,
  };
}

function imageFromDTO(image: AdminProductDTO["images"][number]): ImageDraft {
  return {
    key: draftKey(),
    mediaId: image.mediaId,
    url: image.url,
    alt: image.alt,
    variantId: image.variantId ?? "",
  };
}

export function ProductFormDialog({
  open,
  onOpenChange,
  categories,
  product,
  cloudinaryEnabled,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: AdminCategoryDTO[];
  product?: AdminProductDTO | null;
  cloudinaryEnabled: boolean;
}) {
  if (!open) return null;
  return (
    <ProductFormDialogInner
      open={open}
      onOpenChange={onOpenChange}
      categories={categories}
      product={product}
      cloudinaryEnabled={cloudinaryEnabled}
    />
  );
}

function ProductFormDialogInner({
  onOpenChange,
  categories,
  product,
  cloudinaryEnabled,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: AdminCategoryDTO[];
  product?: AdminProductDTO | null;
  cloudinaryEnabled: boolean;
}) {
  const router = useRouter();
  const prefix = useId().replace(/[:]/g, "");
  const action = product ? updateProductAction : createProductAction;
  const [state, formAction, pending] = useActionState<ProductActionState, FormData>(
    action,
    initialProductState,
  );

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [brand, setBrand] = useState(product?.brand ?? "");
  const [categoryId, setCategoryId] = useState(
    product?.categoryId ?? categories[0]?.id ?? "",
  );
  const [shortDescription, setShortDescription] = useState(product?.shortDescription ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? false);
  const [isActive, setIsActive] = useState(product?.isActive ?? false);
  const [variants, setVariants] = useState<VariantDraft[]>(() =>
    product && product.variants.length > 0
      ? product.variants.map(variantFromDTO)
      : [emptyVariant()],
  );
  const [images, setImages] = useState<ImageDraft[]>(() =>
    product ? product.images.map(imageFromDTO) : [],
  );

  useEffect(() => {
    if (!state.ok) return;
    toast.success(state.message ?? "Product saved.");
    router.refresh();
    onOpenChange(false);
  }, [state, router, onOpenChange]);

  const errors = state.fieldErrors ?? {};
  const fieldError = (field: string) => errors[field]?.[0];
  const variantsError = fieldError("variants");
  const imagesError = fieldError("images");

  const variantsPayload = variants.map((variant, index) => ({
    id: variant.id,
    label: variant.label.trim(),
    sku: variant.sku.trim(),
    flavorProfile: variant.flavorProfile || null,
    nicotineMg: variant.nicotineMg.trim() === "" ? null : Number(variant.nicotineMg),
    color: variant.color.trim() || null,
    priceCentavos: Math.round(Number(variant.pricePesos) * 100),
    stock: Number(variant.stock),
    lowStockThreshold: Number(variant.lowStockThreshold),
    isActive: variant.isActive,
    sortOrder: index,
  }));

  const imagesPayload = images.map((image, index) => ({
    mediaId: image.mediaId,
    alt: image.alt.trim(),
    variantId: image.variantId || null,
    sortOrder: index,
  }));

  function updateVariant(key: string, patch: Partial<VariantDraft>) {
    setVariants((current) =>
      current.map((variant) => (variant.key === key ? { ...variant, ...patch } : variant)),
    );
  }

  function updateImage(key: string, patch: Partial<ImageDraft>) {
    setImages((current) =>
      current.map((image) => (image.key === key ? { ...image, ...patch } : image)),
    );
  }

  function moveImage(index: number, direction: -1 | 1) {
    setImages((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return (
    <Dialog
      open
      onOpenChange={(nextOpen) => {
        if (!pending) onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{product ? `Edit ${product.name}` : "Add product"}</DialogTitle>
          <DialogDescription>
            Drafts stay hidden from the storefront. Publishing requires an active variant and at
            least one described image.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-6" noValidate>
          {product ? <input type="hidden" name="id" value={product.id} /> : null}
          <input type="hidden" name="categoryId" value={categoryId} />
          <input type="hidden" name="isFeatured" value={isFeatured ? "true" : "false"} />
          <input type="hidden" name="isActive" value={isActive ? "true" : "false"} />
          <input type="hidden" name="variants" value={JSON.stringify(variantsPayload)} />
          <input type="hidden" name="images" value={JSON.stringify(imagesPayload)} />

          {state.message && !state.ok ? (
            <Alert variant="destructive">
              <AlertCircle aria-hidden="true" />
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}

          <section aria-labelledby={`${prefix}-details`} className="space-y-4">
            <h3 id={`${prefix}-details`} className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Product details
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`${prefix}-name`}>Name</Label>
                <Input
                  id={`${prefix}-name`}
                  name="name"
                  value={name}
                  onChange={(event) => {
                    const value = event.target.value;
                    setName(value);
                    if (!product && !slugTouched) setSlug(slugify(value));
                  }}
                  required
                  maxLength={140}
                  aria-invalid={Boolean(fieldError("name"))}
                />
                {fieldError("name") ? (
                  <p className="text-xs text-destructive" role="alert">
                    {fieldError("name")}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${prefix}-slug`}>Slug</Label>
                <div className="flex gap-2">
                  <Input
                    id={`${prefix}-slug`}
                    name="slug"
                    value={slug}
                    onChange={(event) => {
                      setSlug(event.target.value);
                      setSlugTouched(true);
                    }}
                    required
                    maxLength={100}
                    aria-invalid={Boolean(fieldError("slug"))}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => {
                      setSlug(slugify(name));
                      setSlugTouched(true);
                    }}
                  >
                    Generate
                  </Button>
                </div>
                {fieldError("slug") ? (
                  <p className="text-xs text-destructive" role="alert">
                    {fieldError("slug")}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${prefix}-brand`}>Brand</Label>
                <Input
                  id={`${prefix}-brand`}
                  name="brand"
                  value={brand}
                  onChange={(event) => setBrand(event.target.value)}
                  required
                  maxLength={80}
                  aria-invalid={Boolean(fieldError("brand"))}
                />
                {fieldError("brand") ? (
                  <p className="text-xs text-destructive" role="alert">
                    {fieldError("brand")}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${prefix}-category`}>Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger id={`${prefix}-category`} aria-invalid={Boolean(fieldError("categoryId"))}>
                    <SelectValue placeholder="Choose a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                        {!category.isActive ? " (inactive)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldError("categoryId") ? (
                  <p className="text-xs text-destructive" role="alert">
                    {fieldError("categoryId")}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${prefix}-short`}>Short description</Label>
              <Input
                id={`${prefix}-short`}
                name="shortDescription"
                value={shortDescription}
                onChange={(event) => setShortDescription(event.target.value)}
                required
                maxLength={220}
                aria-invalid={Boolean(fieldError("shortDescription"))}
              />
              {fieldError("shortDescription") ? (
                <p className="text-xs text-destructive" role="alert">
                  {fieldError("shortDescription")}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${prefix}-description`}>Full description</Label>
              <Textarea
                id={`${prefix}-description`}
                name="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                required
                rows={5}
                aria-invalid={Boolean(fieldError("description"))}
              />
              {fieldError("description") ? (
                <p className="text-xs text-destructive" role="alert">
                  {fieldError("description")}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-5 rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium">
                <Checkbox
                  checked={isFeatured}
                  onCheckedChange={(checked) => setIsFeatured(checked === true)}
                />
                Featured on landing page
              </label>
              <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium">
                <Checkbox
                  checked={isActive}
                  onCheckedChange={(checked) => setIsActive(checked === true)}
                />
                Published to storefront
              </label>
            </div>
          </section>

          <section aria-labelledby={`${prefix}-variants`} className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3
                  id={`${prefix}-variants`}
                  className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground"
                >
                  Variants
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  At least one active variant is required to publish.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setVariants((current) => [...current, emptyVariant()])}
              >
                <Plus aria-hidden="true" /> Add variant
              </Button>
            </div>

            {variantsError ? (
              <p className="text-xs text-destructive" role="alert">
                {variantsError}
              </p>
            ) : null}

            <div className="space-y-3">
              {variants.map((variant, index) => {
                const isLow =
                  Number(variant.stock) <= Number(variant.lowStockThreshold) &&
                  variant.isActive;
                return (
                  <div
                    key={variant.key}
                    className="rounded-2xl border border-white/10 bg-white/[0.02] p-4"
                  >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Variant {index + 1}
                        {isLow ? (
                          <span className="ml-2 text-amber-300">Low stock</span>
                        ) : null}
                      </p>
                      <div className="flex items-center gap-3">
                        <label className="flex cursor-pointer items-center gap-2 text-xs">
                          <Checkbox
                            checked={variant.isActive}
                            onCheckedChange={(checked) =>
                              updateVariant(variant.key, { isActive: checked === true })
                            }
                          />
                          Active
                        </label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() =>
                            setVariants((current) =>
                              current.length > 1
                                ? current.filter((item) => item.key !== variant.key)
                                : current,
                            )
                          }
                          disabled={variants.length === 1}
                          aria-label={`Remove variant ${index + 1}`}
                        >
                          <Trash2 aria-hidden="true" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor={`${prefix}-v${index}-label`}>Label</Label>
                        <Input
                          id={`${prefix}-v${index}-label`}
                          value={variant.label}
                          onChange={(event) =>
                            updateVariant(variant.key, { label: event.target.value })
                          }
                          placeholder="30mg · 30ml"
                          required
                          maxLength={100}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`${prefix}-v${index}-sku`}>SKU</Label>
                        <Input
                          id={`${prefix}-v${index}-sku`}
                          value={variant.sku}
                          onChange={(event) =>
                            updateVariant(variant.key, { sku: event.target.value })
                          }
                          placeholder="BRAND-FLAVOR-30"
                          required
                          maxLength={64}
                        />
                      </div>
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <div className="space-y-1.5">
                        <Label htmlFor={`${prefix}-v${index}-price`}>Price (₱)</Label>
                        <Input
                          id={`${prefix}-v${index}-price`}
                          value={variant.pricePesos}
                          onChange={(event) =>
                            updateVariant(variant.key, { pricePesos: event.target.value })
                          }
                          inputMode="decimal"
                          placeholder="350.00"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`${prefix}-v${index}-stock`}>Stock</Label>
                        <Input
                          id={`${prefix}-v${index}-stock`}
                          value={variant.stock}
                          onChange={(event) =>
                            updateVariant(variant.key, { stock: event.target.value })
                          }
                          type="number"
                          min={0}
                          step={1}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`${prefix}-v${index}-threshold`}>Low-stock at</Label>
                        <Input
                          id={`${prefix}-v${index}-threshold`}
                          value={variant.lowStockThreshold}
                          onChange={(event) =>
                            updateVariant(variant.key, { lowStockThreshold: event.target.value })
                          }
                          type="number"
                          min={0}
                          step={1}
                          required
                        />
                      </div>
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <div className="space-y-1.5">
                        <Label htmlFor={`${prefix}-v${index}-flavor`}>Flavor profile</Label>
                        <Select
                          value={variant.flavorProfile || "none"}
                          onValueChange={(value) =>
                            updateVariant(variant.key, {
                              flavorProfile: value === "none" ? "" : value,
                            })
                          }
                        >
                          <SelectTrigger id={`${prefix}-v${index}-flavor`}>
                            <SelectValue placeholder="None" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {flavorProfiles.map((profile) => (
                              <SelectItem key={profile.value} value={profile.value}>
                                {profile.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`${prefix}-v${index}-nicotine`}>Nicotine (mg)</Label>
                        <Input
                          id={`${prefix}-v${index}-nicotine`}
                          value={variant.nicotineMg}
                          onChange={(event) =>
                            updateVariant(variant.key, { nicotineMg: event.target.value })
                          }
                          type="number"
                          min={0}
                          max={100}
                          step={1}
                          placeholder="Optional"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`${prefix}-v${index}-color`}>Colour / finish</Label>
                        <Input
                          id={`${prefix}-v${index}-color`}
                          value={variant.color}
                          onChange={(event) =>
                            updateVariant(variant.key, { color: event.target.value })
                          }
                          maxLength={50}
                          placeholder="Optional"
                        />
                      </div>
                    </div>

                    {variant.id && !variant.isActive ? (
                      <p className="mt-3 text-xs text-muted-foreground">
                        Inactive variants stay in order history but are hidden from the storefront.
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>

          <section aria-labelledby={`${prefix}-images`} className="space-y-3">
            <div>
              <h3
                id={`${prefix}-images`}
                className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground"
              >
                Images
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                The first image is the catalogue thumbnail. Alt text is required before publishing.
              </p>
            </div>

            {imagesError ? (
              <p className="text-xs text-destructive" role="alert">
                {imagesError}
              </p>
            ) : null}

            <ProductImageUploader
              enabled={cloudinaryEnabled}
              onUploaded={(media) => {
                setImages((current) => [
                  ...current,
                  {
                    key: draftKey(),
                    mediaId: media.mediaId,
                    url: media.url,
                    alt: "",
                    variantId: "",
                  },
                ]);
              }}
            />

            {images.length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/12 bg-white/[0.02] p-4 text-xs leading-5 text-muted-foreground">
                No images yet. A published product needs at least one image with descriptive alt
                text.
              </p>
            ) : (
              <ul className="space-y-3">
                {images.map((image, index) => (
                  <li
                    key={image.key}
                    className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-3 sm:grid-cols-[72px_1fr_auto]"
                  >
                    <div className="relative size-[72px] overflow-hidden rounded-xl border border-white/10 bg-muted">
                      {image.url ? (
                        <Image
                          src={image.url}
                          alt={image.alt || "Product image preview"}
                          fill
                          sizes="72px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="grid h-full place-items-center text-muted-foreground">
                          <ImageOff className="size-5" aria-hidden="true" />
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 space-y-2">
                      <div className="space-y-1.5">
                        <Label htmlFor={`${prefix}-img${index}-alt`}>
                          Alt text for image {index + 1}
                        </Label>
                        <Input
                          id={`${prefix}-img${index}-alt`}
                          value={image.alt}
                          onChange={(event) =>
                            updateImage(image.key, { alt: event.target.value })
                          }
                          placeholder="Describe the product packaging and flavour"
                          maxLength={160}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`${prefix}-img${index}-variant`}>
                          Show with variant (optional)
                        </Label>
                        <Select
                          value={image.variantId || "all"}
                          onValueChange={(value) =>
                            updateImage(image.key, { variantId: value === "all" ? "" : value })
                          }
                          disabled={!product}
                        >
                          <SelectTrigger id={`${prefix}-img${index}-variant`}>
                            <SelectValue placeholder="Whole product" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Whole product</SelectItem>
                            {variants
                              .filter((variant) => Boolean(variant.id))
                              .map((variant) => (
                                <SelectItem key={variant.key} value={variant.id as string}>
                                  {variant.label || variant.sku || "Untitled variant"}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        {!product ? (
                          <p className="text-[11px] text-muted-foreground">
                            Save the product first to link images to a specific variant.
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex gap-1 sm:flex-col">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => moveImage(index, -1)}
                        disabled={index === 0}
                        aria-label={`Move image ${index + 1} up`}
                      >
                        <ArrowUp aria-hidden="true" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => moveImage(index, 1)}
                        disabled={index === images.length - 1}
                        aria-label={`Move image ${index + 1} down`}
                      >
                        <ArrowDown aria-hidden="true" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() =>
                          setImages((current) =>
                            current.filter((item) => item.key !== image.key),
                          )
                        }
                        aria-label={`Remove image ${index + 1}`}
                      >
                        <X aria-hidden="true" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <DialogFooter className="border-t border-white/10 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending || categories.length === 0}>
              {pending ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden="true" /> Saving…
                </>
              ) : (
                <>
                  <ChevronDown className="rotate-[-90deg]" aria-hidden="true" />
                  {product ? "Save changes" : "Save product"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
