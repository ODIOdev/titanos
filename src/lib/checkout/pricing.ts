import {
  availableStockForLine,
  optionsFromVariantKey,
  parseVariantKey,
} from "@/lib/catalog/inventory";
import { getProductById } from "@/lib/data/products";
import { FREE_SHIPPING_THRESHOLD as DEFAULT_FREE_SHIPPING_THRESHOLD } from "@/lib/data/seed-data";

export const CHECKOUT_STANDARD_SHIPPING = 12.99;
export const CHECKOUT_TAX_RATE = 0.08;

export type CheckoutLineInput = {
  productId: string;
  quantity: number;
  variantId?: string | null;
};

export type CheckoutLineItem = {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl: string | null;
  variantId: string | null;
  color: string | null;
  size: string | null;
};

export type CheckoutTotals = {
  subtotal: number;
  shippingAmount: number;
  taxAmount: number;
  total: number;
};

export async function resolveCheckoutLineItems(
  items: CheckoutLineInput[],
): Promise<{ lineItems: CheckoutLineItem[] } | { error: string; status: number }> {
  const lineItems: CheckoutLineItem[] = [];
  /** Aggregate demand per product+variant so multi-line carts can't oversell. */
  const demand = new Map<string, number>();

  for (const item of items) {
    const key = `${item.productId}::${item.variantId ?? ""}`;
    demand.set(key, (demand.get(key) ?? 0) + item.quantity);
  }

  for (const item of items) {
    const product = await getProductById(item.productId);
    if (!product || !product.active) {
      return { error: `Product not found: ${item.productId}`, status: 400 };
    }

    const parsed = parseVariantKey(item.variantId);
    const available = availableStockForLine(product, {
      variantKey: item.variantId,
      color: parsed.color,
      size: parsed.size,
    });
    const requested =
      demand.get(`${item.productId}::${item.variantId ?? ""}`) ?? item.quantity;

    if (available < requested) {
      return {
        error: `Insufficient stock for ${product.name}${
          parsed.size ? ` (${parsed.size})` : ""
        }`,
        status: 400,
      };
    }

    const unitPrice = Number(product.price);
    const opts = optionsFromVariantKey(item.variantId);
    lineItems.push({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      quantity: item.quantity,
      unitPrice,
      totalPrice: unitPrice * item.quantity,
      imageUrl:
        product.image_url ??
        product.images?.find((img) => img.is_primary)?.url ??
        product.images?.[0]?.url ??
        null,
      variantId: item.variantId?.trim() || null,
      color: opts.color ?? null,
      size: opts.size ?? null,
    });
  }

  return { lineItems };
}

export function computeCheckoutTotals(
  lineItems: CheckoutLineItem[],
  freeShippingThreshold: number = DEFAULT_FREE_SHIPPING_THRESHOLD,
): CheckoutTotals {
  const subtotal = lineItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const shippingAmount =
    subtotal >= freeShippingThreshold ? 0 : CHECKOUT_STANDARD_SHIPPING;
  const taxAmount = Number((subtotal * CHECKOUT_TAX_RATE).toFixed(2));
  const total = Number((subtotal + shippingAmount + taxAmount).toFixed(2));
  return { subtotal, shippingAmount, taxAmount, total };
}

export function orderItemOptionsFromLine(item: CheckoutLineItem) {
  if (!item.variantId && !item.color && !item.size) return {};
  return {
    ...(item.color ? { color: item.color } : {}),
    ...(item.size ? { size: item.size } : {}),
    ...(item.variantId ? { variant_key: item.variantId } : {}),
  };
}
