import type { Metadata } from "next";
import { CatalogBrowser } from "@/components/storefront/catalog-browser";
import { getCatalogProducts } from "@/lib/data/catalog";
import { categoryDefinitions } from "@/lib/config";

type ProductsPageProps = {
  searchParams: Promise<{ category?: string; q?: string }>;
};

export async function generateMetadata({ searchParams }: ProductsPageProps): Promise<Metadata> {
  const params = await searchParams;
  const category = categoryDefinitions.find((item) => item.slug === params.category);
  const title = category ? `${category.name} · Catalog` : "Shop all products";
  return {
    title,
    description: category?.description ?? "Browse the full Vapor District collection.",
    alternates: { canonical: category ? `/products?category=${category.slug}` : "/products" },
    robots: params.q ? { index: false, follow: true } : undefined,
  };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const [products, params] = await Promise.all([getCatalogProducts(), searchParams]);

  return (
    <CatalogBrowser
      products={products}
      initialCategory={params.category}
      initialSearch={params.q}
    />
  );
}
