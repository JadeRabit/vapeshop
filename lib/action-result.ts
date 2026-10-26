export type FieldErrors = Record<string, string[]>;

export type ActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: FieldErrors;
  redirectTo?: string;
};

export const initialActionState: ActionState = { ok: false };

export type AddressActionState = ActionState & {
  addressId?: string;
};

export const initialAddressState: AddressActionState = { ok: false };

export type CheckoutActionState = ActionState & {
  orderNumber?: string;
  checkoutUrl?: string;
  rotateKey?: boolean;
};

export const initialCheckoutState: CheckoutActionState = { ok: false };

export type ProductActionState = ActionState & {
  productId?: string;
  slug?: string;
};

export const initialProductState: ProductActionState = { ok: false };

export type StockActionState = ActionState & {
  variantId?: string;
  stock?: number;
};

export const initialStockState: StockActionState = { ok: false };

export type OrderActionState = ActionState & {
  orderNumber?: string;
  status?: string;
};

export const initialOrderState: OrderActionState = { ok: false };

export function firstFieldError(state: ActionState, field: string) {
  return state.fieldErrors?.[field]?.[0];
}
