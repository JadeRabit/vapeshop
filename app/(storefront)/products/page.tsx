import type { Metadata } from "next";
import { CatalogBrowser } from "@/components/storefront/catalog-browser";
import { ComingSoonCategory } from "@/components/storefront/coming-soon-category";
import { getCatalogProducts } from "@/lib/data/catalog";
import { categoryDefinitions } from "@/lib/config";

type ProductsPageProps = {
  searchParams: Promise<{ category?: string; q?: string }>;
};

export async function generateMetadata({ searchParams }: ProductsPageProps): Promise<Metadata> {
  const params = await searchParams;
  const category = categoryDefinitions.find((item) => item.slug === params.category);
  const title = category
    ? category.comingSoon
      ? `${category.name} · Coming soon`
      : `${category.name} · Catalog`
    : "Shop all products";
  return {
    title,
    description: category?.description ?? "Browse the full Vapor District collection.",
    alternates: { canonical: category ? `/products?category=${category.slug}` : "/products" },
    robots:
      params.q || category?.comingSoon ? { index: false, follow: true } : undefined,
  };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const category = categoryDefinitions.find((item) => item.slug === params.category);

  if (category?.comingSoon) {
    return <ComingSoonCategory title={category.name} description={category.description} />;
  }

  const products = await getCatalogProducts();

  return (
    <CatalogBrowser
      products={products}
      initialCategory={params.category}
      initialSearch={params.q}
    />
  );
}
