"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Filter, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ProductCard } from "@/components/storefront/product-card";
import type { ProductCardDTO } from "@/lib/data/catalog";
import { categoryDefinitions, flavorProfiles } from "@/lib/config";
import { cn } from "@/lib/utils";

const PRICE_RANGES = [
  { value: "all", label: "Any price", min: 0, max: Number.POSITIVE_INFINITY },
  { value: "under-500", label: "Under ₱500", min: 0, max: 50000 },
  { value: "500-1000", label: "₱500 – ₱1,000", min: 50000, max: 100000 },
  { value: "1000-2000", label: "₱1,000 – ₱2,000", min: 100000, max: 200000 },
  { value: "over-2000", label: "Over ₱2,000", min: 200000, max: Number.POSITIVE_INFINITY },
] as const;

type Filters = {
  category: string;
  nicotine: string;
  flavor: string;
  price: string;
  inStock: boolean;
};

const EMPTY_FILTERS: Filters = {
  category: "all",
  nicotine: "all",
  flavor: "all",
  price: "all",
  inStock: false,
};

function buildNicotineOptions(products: ProductCardDTO[]) {
  const values = new Set<number>();
  for (const product of products) {
    for (const variant of product.variants) {
      if (variant.nicotineMg != null) values.add(variant.nicotineMg);
    }
  }
  return [...values].sort((a, b) => a - b);
}

function FilterPanel({
  idPrefix,
  filters,
  setFilters,
  nicotineOptions,
  onClear,
}: {
  idPrefix: string;
  filters: Filters;
  setFilters: (updater: (current: Filters) => Filters) => void;
  nicotineOptions: number[];
  onClear: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <SlidersHorizontal className="size-4 text-primary" aria-hidden="true" />
          Filters
        </h2>
        <Button type="button" variant="ghost" size="sm" onClick={onClear}>
          Clear all
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-category`}>Category</Label>
        <Select
          value={filters.category}
          onValueChange={(value) =>
            setFilters((current) => ({ ...current, category: value }))
          }
        >
          <SelectTrigger id={`${idPrefix}-category`}>
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categoryDefinitions.map((category) => (
              <SelectItem key={category.slug} value={category.slug}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-flavor`}>Flavor profile</Label>
        <Select
          value={filters.flavor}
          onValueChange={(value) => setFilters((current) => ({ ...current, flavor: value }))}
        >
          <SelectTrigger id={`${idPrefix}-flavor`}>
            <SelectValue placeholder="Any flavor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any flavor</SelectItem>
            {flavorProfiles.map((flavor) => (
              <SelectItem key={flavor.value} value={flavor.value}>
                {flavor.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-price`}>Price range</Label>
        <Select
          value={filters.price}
          onValueChange={(value) => setFilters((current) => ({ ...current, price: value }))}
        >
          <SelectTrigger id={`${idPrefix}-price`}>
            <SelectValue placeholder="Any price" />
          </SelectTrigger>
          <SelectContent>
            {PRICE_RANGES.map((range) => (
              <SelectItem key={range.value} value={range.value}>
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <fieldset className="space-y-2.5">
        <legend className="text-sm font-medium">Nicotine strength</legend>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilters((current) => ({ ...current, nicotine: "all" }))}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              filters.nicotine === "all"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-white/12 text-muted-foreground hover:border-white/25 hover:text-foreground",
            )}
            aria-pressed={filters.nicotine === "all"}
          >
            Any
          </button>
          {nicotineOptions.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() =>
                setFilters((current) => ({
                  ...current,
                  nicotine: String(value),
                }))
              }
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                filters.nicotine === String(value)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-white/12 text-muted-foreground hover:border-white/25 hover:text-foreground",
              )}
              aria-pressed={filters.nicotine === String(value)}
            >
              {value}mg
            </button>
          ))}
        </div>
      </fieldset>

      <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
        <Checkbox
          id={`${idPrefix}-in-stock`}
          checked={filters.inStock}
          onCheckedChange={(checked) =>
            setFilters((current) => ({ ...current, inStock: checked === true }))
          }
        />
        <div className="space-y-1">
          <Label htmlFor={`${idPrefix}-in-stock`} className="cursor-pointer">
            In stock only
          </Label>
          <p className="text-xs leading-5 text-muted-foreground">
            Hide products where every variant is sold out.
          </p>
        </div>
      </div>
    </div>
  );
}

export function CatalogBrowser({
  products,
  initialCategory,
  initialSearch,
}: {
  products: ProductCardDTO[];
  initialCategory?: string;
  initialSearch?: string;
}) {
  const [search, setSearch] = useState(initialSearch ?? "");
  const [filters, setFilters] = useState<Filters>({
    ...EMPTY_FILTERS,
    category: initialCategory && categoryDefinitions.some((item) => item.slug === initialCategory)
      ? initialCategory
      : "all",
  });

  const nicotineOptions = useMemo(() => buildNicotineOptions(products), [products]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const priceRange = PRICE_RANGES.find((range) => range.value === filters.price) ?? PRICE_RANGES[0];

    return products.filter((product) => {
      if (filters.category !== "all" && product.category.slug !== filters.category) return false;

      if (query) {
        const haystack = [
          product.name,
          product.brand,
          product.category.name,
          ...product.variants.map((variant) => variant.label),
          ...product.variants.map((variant) => variant.flavorProfile ?? ""),
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      if (
        filters.nicotine !== "all" &&
        !product.variants.some((variant) => String(variant.nicotineMg) === filters.nicotine)
      ) {
        return false;
      }

      if (
        filters.flavor !== "all" &&
        !product.variants.some((variant) => variant.flavorProfile === filters.flavor)
      ) {
        return false;
      }

      if (filters.inStock && !product.inStock) return false;

      if (
        product.lowestPriceCentavos < priceRange.min ||
        product.lowestPriceCentavos > priceRange.max
      ) {
        return false;
      }

      return true;
    });
  }, [filters, products, search]);

  const activeFilterCount =
    (filters.category !== "all" ? 1 : 0) +
    (filters.nicotine !== "all" ? 1 : 0) +
    (filters.flavor !== "all" ? 1 : 0) +
    (filters.price !== "all" ? 1 : 0) +
    (filters.inStock ? 1 : 0);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.category !== "all") params.set("category", filters.category);
    if (filters.flavor !== "all") params.set("flavor", filters.flavor);
    if (filters.nicotine !== "all") params.set("nicotine", filters.nicotine);
    if (filters.price !== "all") params.set("price", filters.price);
    if (filters.inStock) params.set("inStock", "1");
    if (search.trim()) params.set("q", search.trim());
    const query = params.toString();
    window.history.replaceState(null, "", query ? `/products?${query}` : "/products");
  }, [filters, search]);

  function clearAll() {
    setSearch("");
    setFilters(EMPTY_FILTERS);
  }

  const activeCategory = categoryDefinitions.find((item) => item.slug === filters.category);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">The shelf</p>
        <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">
          {activeCategory ? activeCategory.name : "Shop all products"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {activeCategory
            ? activeCategory.description
            : "Search the full range, combine filters, and see exactly what is ready to ship."}
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, brand, or flavor…"
            aria-label="Search products"
            className="h-12 pl-10"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-white/10 hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="lg:hidden">
                <Filter aria-hidden="true" /> Filters
                {activeFilterCount > 0 ? (
                  <span className="grid size-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {activeFilterCount}
                  </span>
                ) : null}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[88dvh]">
              <SheetHeader>
                <SheetTitle>Filter products</SheetTitle>
                <SheetDescription>
                  Filters combine with “and” and update the list immediately.
                </SheetDescription>
              </SheetHeader>
              <FilterPanel
                idPrefix="mobile"
                filters={filters}
                setFilters={setFilters}
                nicotineOptions={nicotineOptions}
                onClear={clearAll}
              />
              <SheetClose asChild>
                <Button type="button" className="w-full">
                  Show {filtered.length} result{filtered.length === 1 ? "" : "s"}
                </Button>
              </SheetClose>
            </SheetContent>
          </Sheet>

          <p className="whitespace-nowrap text-sm text-muted-foreground" aria-live="polite">
            <span className="font-semibold text-foreground">{filtered.length}</span> of{" "}
            {products.length} products
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block" aria-label="Product filters">
          <div className="sticky top-24 rounded-2xl border border-white/10 bg-card p-5">
            <FilterPanel
              idPrefix="desktop"
              filters={filters}
              setFilters={setFilters}
              nicotineOptions={nicotineOptions}
              onClear={clearAll}
            />
          </div>
        </aside>

        <div>
          {activeFilterCount > 0 || search ? (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {search ? (
                <Badge variant="muted">Search: {search}</Badge>
              ) : null}
              {activeCategory ? <Badge variant="muted">{activeCategory.name}</Badge> : null}
              {filters.flavor !== "all" ? (
                <Badge variant="muted">
                  {flavorProfiles.find((flavor) => flavor.value === filters.flavor)?.label}
                </Badge>
              ) : null}
              {filters.nicotine !== "all" ? (
                <Badge variant="muted">{filters.nicotine}mg</Badge>
              ) : null}
              {filters.price !== "all" ? (
                <Badge variant="muted">
                  {PRICE_RANGES.find((range) => range.value === filters.price)?.label}
                </Badge>
              ) : null}
              {filters.inStock ? <Badge variant="muted">In stock</Badge> : null}
              <Button type="button" variant="link" size="sm" onClick={clearAll}>
                Clear all
              </Button>
            </div>
          ) : null}

          {filtered.length === 0 ? (
            <EmptyState
              title="Nothing matches those filters."
              description="Try a broader search or reset the filters. The full shelf is one click away."
              icon={<Sparkles className="size-6" aria-hidden="true" />}
              action={
                <Button type="button" onClick={clearAll}>
                  Reset filters
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((product, index) => (
                <ProductCard key={product.id} product={product} priority={index < 3} />
              ))}
            </div>
          )}

          <p className="mt-10 text-center text-xs text-muted-foreground">
            Need help choosing?{" "}
            <Link href="/products?category=pod-systems" className="text-primary hover:underline">
              Start with a pod system
            </Link>{" "}
            or contact support.
          </p>
        </div>
      </div>
    </div>
  );
}
