export const siteConfig = {
  name: "SmokeyFruit Co.",
  legalName: "SmokeyFruit Co.",
  tagline: "Elevated vapor. Zero compromise.",
  logo: "/logo.png",
  description:
    "A curated 21+ vape shop for premium e-liquids, pod systems, and everyday essentials. Adult signature required on delivery.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  supportEmail: "drarkgraphicsken@gmail.com",
  supportPhone: "+63 917 555 0121",
  address: "Metro Manila, Philippines",
  currency: "PHP",
  currencyLocale: "en-PH",
  shippingFlatCentavos: 9900,
  freeShippingThresholdCentavos: 250000,
  vatNote: "All prices are VAT-inclusive.",
  ageExitUrl: "https://www.google.com/",
  ageCookieName: "vapeshop_age_verified",
  ageCookieDays: 30,
  ageStorageVersion: 1,
  orderExpiryMinutes: 30,
  pageSize: 10,
  publicPageSize: 12,
} as const;

export const storefrontNav = [
  { href: "/products", label: "Shop all", comingSoon: false },
  { href: "/products?category=nic-salts", label: "Nic Salts", comingSoon: false },
  { href: "/products?category=freebase", label: "Freebase", comingSoon: false },
  { href: "/products?category=pod-systems", label: "Pods", comingSoon: false },
  { href: "/products?category=disposables", label: "Disposables", comingSoon: true },
  { href: "/products?category=mods-tanks", label: "Mods & Tanks", comingSoon: true },
] as const;

export const categoryDefinitions = [
  {
    slug: "nic-salts",
    name: "Nic Salts",
    description: "Smooth, fast-acting salt nicotine blends for pod devices.",
    eyebrow: "E-Liquids",
    accent: "from-lime-300/20",
    comingSoon: false,
  },
  {
    slug: "freebase",
    name: "Freebase",
    description: "Classic freebase e-liquids built for flavour chasers.",
    eyebrow: "E-Liquids",
    accent: "from-cyan-300/20",
    comingSoon: false,
  },
  {
    slug: "pod-systems",
    name: "Pod Systems",
    description: "Pocketable, refillable systems with effortless draws.",
    eyebrow: "Hardware",
    accent: "from-violet-400/20",
    comingSoon: false,
  },
  {
    slug: "disposables",
    name: "Disposables",
    description: "Ready-to-vape devices with bold, consistent flavour.",
    eyebrow: "Hardware",
    accent: "from-fuchsia-400/20",
    comingSoon: true,
  },
  {
    slug: "mods-tanks",
    name: "Mods & Tanks",
    description: "High-performance box mods, rebuildables, and tanks.",
    eyebrow: "Hardware",
    accent: "from-orange-300/20",
    comingSoon: true,
  },
  {
    slug: "coils-accessories",
    name: "Coils & Accessories",
    description: "Replacement coils, pods, tools, and everyday essentials.",
    eyebrow: "Essentials",
    accent: "from-emerald-300/20",
    comingSoon: false,
  },
] as const;

export type CategoryDefinition = (typeof categoryDefinitions)[number];

export const comingSoonCategorySlugs = categoryDefinitions
  .filter((category) => category.comingSoon)
  .map((category) => category.slug);

export const availableCategoryDefinitions = categoryDefinitions.filter(
  (category) => !category.comingSoon,
);

export function isCategoryComingSoon(slug: string) {
  return categoryDefinitions.some((category) => category.slug === slug && category.comingSoon);
}

export const flavorProfiles = [
  { value: "FRUITY", label: "Fruity" },
  { value: "MENTHOL", label: "Menthol" },
  { value: "DESSERT", label: "Dessert" },
  { value: "TOBACCO", label: "Tobacco" },
  { value: "OTHER", label: "Other" },
] as const;

export const orderStatuses = [
  "PENDING",
  "PAID",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

export const orderStatusLabels = {
  PENDING: "Pending",
  PAID: "Paid",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
} as const;

export const paymentMethodLabels = {
  COD: "Cash on Delivery",
  GCASH: "GCash",
  CARD: "Card",
} as const;

export const promoMessages = [
  "Free shipping on orders over ₱2,500",
  "21+ only · Valid ID may be requested on delivery",
  "Authenticated products · Carefully packed",
] as const;
