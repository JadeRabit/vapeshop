import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ImageOff, Search, Sparkles } from "lucide-react";
import { requirePageAdmin } from "@/lib/auth-guards";
import { getAdminCategories, getAdminProductList } from "@/lib/data/admin-products";
import { env } from "@/lib/env";
import { isCategoryComingSoon } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { Price } from "@/components/shared/price";
import { NewProductButton } from "@/components/admin/new-product-button";
import { ProductRowActions } from "@/components/admin/product-row-actions";
import { cn, formatRelativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Products",
  robots: { index: false, follow: false },
};

type AdminProductsPageProps = {
  searchParams: Promise<{
    q?: string;
    page?: string;
    status?: string;
    category?: string;
    lowStock?: string;
    comingSoon?: string;
  }>;
};

function productsHref({
  q,
  status,
  category,
  lowStock,
  comingSoon,
}: {
  q?: string;
  status?: string;
  category?: string;
  lowStock?: boolean;
  comingSoon?: boolean;
}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (category) params.set("category", category);
  if (status && status !== "all") params.set("status", status);
  if (lowStock) params.set("lowStock", "1");
  if (comingSoon) params.set("comingSoon", "1");
  const query = params.toString();
  return query ? `/admin/products?${query}` : "/admin/products";
}

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  await requirePageAdmin();
  const params = await searchParams;
  const search = params.q?.trim() ?? "";
  const page = Number.parseInt(params.page ?? "1", 10);

  const [result, categories] = await Promise.all([
    getAdminProductList({
      search,
      page: Number.isFinite(page) ? page : 1,
      status: params.status,
      category: params.category,
      lowStock: params.lowStock,
      comingSoon: params.comingSoon,
    }),
    getAdminCategories(),
  ]);

  const hasFilters =
    Boolean(search) ||
    result.status !== "all" ||
    Boolean(result.category) ||
    result.lowStock ||
    result.comingSoon;

  const chips = [
    {
      label: "All products",
      count: result.summary.total,
      href: productsHref({ q: search || undefined, category: result.category || undefined }),
      active: !result.lowStock && !result.comingSoon && result.status === "all",
    },
    {
      label: "Published",
      count: result.summary.published,
      href: productsHref({
        q: search || undefined,
        category: result.category || undefined,
        status: "published",
      }),
      active: result.status === "published",
    },
    {
      label: "Drafts",
      count: result.summary.draft,
      href: productsHref({
        q: search || undefined,
        category: result.category || undefined,
        status: "draft",
      }),
      active: result.status === "draft",
    },
    {
      label: "Low stock",
      count: result.summary.lowStock,
      href: productsHref({
        q: search || undefined,
        category: result.category || undefined,
        lowStock: true,
      }),
      active: result.lowStock,
    },
    {
      label: "Coming soon",
      count: result.summary.comingSoon,
      href: productsHref({
        q: search || undefined,
        category: result.category || undefined,
        comingSoon: true,
      }),
      active: result.comingSoon,
    },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            Catalogue
          </p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage catalogue, variants, publishing, and stock.
          </p>
        </div>
        <NewProductButton categories={categories} cloudinaryEnabled={env.isCloudinaryConfigured} />
      </header>

      <nav aria-label="Product filters" className="flex gap-2 overflow-x-auto pb-1">
        {chips.map((chip) => (
          <Link
            key={chip.label}
            href={chip.href}
            aria-current={chip.active ? "page" : undefined}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors",
              chip.active
                ? "border-primary/35 bg-primary/[0.08] text-primary"
                : "border-white/10 bg-white/[0.02] text-muted-foreground hover:border-white/20 hover:text-foreground",
            )}
          >
            {chip.label}
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
                chip.active
                  ? "bg-primary/15 text-primary"
                  : "bg-white/[0.06] text-muted-foreground",
              )}
            >
              {chip.count}
            </span>
          </Link>
        ))}
      </nav>

      <Card className="p-4">
        <form method="get" className="flex flex-wrap items-end gap-2">
          {result.status !== "all" ? (
            <input type="hidden" name="status" value={result.status} />
          ) : null}
          {result.lowStock ? <input type="hidden" name="lowStock" value="1" /> : null}
          {result.comingSoon ? <input type="hidden" name="comingSoon" value="1" /> : null}

          <div className="min-w-[220px] flex-1">
            <label
              htmlFor="product-search"
              className="mb-1.5 block text-xs font-medium text-muted-foreground"
            >
              Search by product name or variant SKU
            </label>
            <Input
              id="product-search"
              name="q"
              type="search"
              defaultValue={search}
              placeholder="Mango Ice or TL-MANGO-30"
            />
          </div>

          <div className="min-w-[180px]">
            <label
              htmlFor="product-category"
              className="mb-1.5 block text-xs font-medium text-muted-foreground"
            >
              Category
            </label>
            <select
              id="product-category"
              name="category"
              defaultValue={result.category}
              className="h-11 w-full rounded-xl border border-input bg-white/[0.035] px-3.5 text-sm text-foreground focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                  {category.isComingSoon ? " · Coming soon" : ""}
                </option>
              ))}
            </select>
          </div>

          <Button type="submit" variant="outline">
            <Search aria-hidden="true" /> Apply
          </Button>
          {hasFilters ? (
            <Button asChild variant="ghost">
              <Link href="/admin/products">Clear</Link>
            </Button>
          ) : null}
        </form>
      </Card>

      {result.products.length === 0 ? (
        <EmptyState
          title={hasFilters ? "No products matched." : "No products yet."}
          description={
            hasFilters
              ? "Try a different search term or filter, or clear the filters to see the full catalogue."
              : "Create your first product to start building the storefront catalogue."
          }
          action={
            hasFilters ? (
              <Button asChild variant="outline">
                <Link href="/admin/products">Clear filters</Link>
              </Button>
            ) : (
              <NewProductButton
                categories={categories}
                cloudinaryEnabled={env.isCloudinaryConfigured}
              />
            )
          }
        />
      ) : (
        <Card className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="hidden xl:table-cell">Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.products.map((product) => {
                const image = product.images[0];
                const comingSoon = isCategoryComingSoon(product.categorySlug);
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="relative size-11 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-muted">
                          {image?.url ? (
                            <Image
                              src={image.url}
                              alt={image.alt}
                              fill
                              sizes="44px"
                              className="object-cover"
                            />
                          ) : (
                            <span className="grid h-full place-items-center text-muted-foreground">
                              <ImageOff className="size-4" aria-hidden="true" />
                            </span>
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="flex flex-wrap items-center gap-1.5">
                            {product.isActive ? (
                              <Link
                                href={`/products/${product.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="truncate text-sm font-semibold hover:text-primary"
                              >
                                {product.name}
                              </Link>
                            ) : (
                              <span className="truncate text-sm font-semibold">{product.name}</span>
                            )}
                            {product.isFeatured ? (
                              <Sparkles
                                className="size-3.5 shrink-0 text-secondary"
                                aria-label="Featured"
                              />
                            ) : null}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {product.brand} · {product.slug}
                          </span>
                          <span className="block text-[11px] text-muted-foreground">
                            {product.variants.length}{" "}
                            {product.variants.length === 1 ? "variant" : "variants"}
                          </span>
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap md:table-cell">
                      <span className="block text-sm">{product.categoryName}</span>
                      {comingSoon ? (
                        <Badge variant="info" className="mt-1">
                          Coming soon
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant={product.isActive ? "success" : "muted"}>
                          {product.isActive ? "Published" : "Draft"}
                        </Badge>
                        {product.isFeatured ? <Badge variant="info">Featured</Badge> : null}
                      </div>
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap lg:table-cell">
                      <Price centavos={product.lowestPriceCentavos} />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm tabular-nums">{product.totalStock}</span>
                        {product.totalStock === 0 ? (
                          <Badge variant="destructive">Out</Badge>
                        ) : product.isLowStock ? (
                          <Badge variant="warning">Low</Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap text-xs text-muted-foreground xl:table-cell">
                      {formatRelativeTime(product.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <ProductRowActions
                        product={product}
                        categories={categories}
                        cloudinaryEnabled={env.isCloudinaryConfigured}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <Pagination
            basePath="/admin/products"
            page={result.page}
            pageCount={result.pageCount}
            total={result.total}
            params={{
              q: search || undefined,
              status: result.status === "all" ? undefined : result.status,
              category: result.category || undefined,
              lowStock: result.lowStock ? "1" : undefined,
              comingSoon: result.comingSoon ? "1" : undefined,
            }}
            className="mt-4"
          />
        </Card>
      )}
    </div>
  );
}
