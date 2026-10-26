export type CheckoutQuoteLine = {
  variantId: string;
  productName: string;
  productSlug: string;
  variantLabel: string;
  sku: string;
  unitPriceCentavos: number;
  quantity: number;
  lineTotalCentavos: number;
  stock: number;
  imageUrl: string | null;
  imageAlt: string;
  issue: string | null;
};

export type CheckoutQuoteResult = {
  ok: boolean;
  message?: string;
  lines?: CheckoutQuoteLine[];
  subtotalCentavos?: number;
  shippingCentavos?: number;
  totalCentavos?: number;
  hasIssues?: boolean;
};
