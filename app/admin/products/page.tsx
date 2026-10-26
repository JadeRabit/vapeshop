import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ImageOff, Search } from "lucide-react";
import { requirePageAdmin } from "@/lib/auth-guards";
import { getAdminCategories, getAdminProductList } from "@/lib/data/admin-products";
import { env } from "@/lib/env";
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

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Products",
  robots: { index: false, follow: false },
};

type AdminProductsPageProps = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  await requirePageAdmin();
  const params = await searchParams;
  const search = params.q?.trim() ?? "";
  const page = Number.parseInt(params.page ?? "1", 10);

  const [result, categories] = await Promise.all([
    getAdminProductList({ search, page: Number.isFinite(page) ? page : 1 }),
    getAdminCategories(),
  ]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold sm:text-4xl">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage catalogue, variants, publishing, and stock.
          </p>
        </div>
        <NewProductButton categories={categories} cloudinaryEnabled={env.isCloudinaryConfigured} />
      </header>

      <Card className="p-4">
        <form method="get" className="flex flex-wrap items-end gap-2">
          <div className="min-w-[220px] flex-1">
            <label htmlFor="product-search" className="mb-1.5 block text-xs font-medium text-muted-foreground">
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
          <Button type="submit" variant="outline">
            <Search aria-hidden="true" /> Search
          </Button>
          {search ? (
            <Button asChild variant="ghost">
              <Link href="/admin/products">Clear</Link>
            </Button>
          ) : null}
        </form>
      </Card>

      {result.products.length === 0 ? (
        <EmptyState
          title={search ? "No products matched." : "No products yet."}
          description={
            search
              ? `Nothing matched “${search}”. Try a different name or SKU, or clear the search.`
              : "Create your first product to start building the storefront catalogue."
          }
          action={
            search ? (
              <Button asChild variant="outline">
                <Link href="/admin/products">Clear search</Link>
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
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.products.map((product) => {
                const image = product.images[0];
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
                          <span className="block truncate text-sm font-semibold">{product.name}</span>
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
                    <TableCell className="whitespace-nowrap text-sm">
                      {product.categoryName}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant={product.isActive ? "success" : "muted"}>
                          {product.isActive ? "Published" : "Draft"}
                        </Badge>
                        {product.isFeatured ? <Badge variant="info">Featured</Badge> : null}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Price centavos={product.lowestPriceCentavos} />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm tabular-nums">{product.totalStock}</span>
                        {product.isLowStock ? <Badge variant="warning">Low</Badge> : null}
                      </div>
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
            params={{ q: search || undefined }}
            className="mt-4"
          />
        </Card>
      )}
    </div>
  );
}
