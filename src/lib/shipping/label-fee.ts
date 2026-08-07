/** Customer shipping charge = carrier label cost + platform fee. */
export const SHIPPING_LABEL_FEE_PERCENT = 0.12;

export type LabelShippingBreakdown = {
  carrierCost: number;
  feePercent: number;
  feeAmount: number;
  charged: number;
};

export function computeLabelShipping(carrierCost: number): LabelShippingBreakdown {
  const cost = Math.max(0, Number(carrierCost) || 0);
  const feeAmount = Math.round(cost * SHIPPING_LABEL_FEE_PERCENT * 100) / 100;
  const charged = Math.round((cost + feeAmount) * 100) / 100;
  return {
    carrierCost: Math.round(cost * 100) / 100,
    feePercent: SHIPPING_LABEL_FEE_PERCENT * 100,
    feeAmount,
    charged,
  };
}

export function computeOrderTotal(input: {
  subtotal: number;
  shippingAmount: number;
  taxAmount: number;
  discountAmount: number;
}) {
  const total =
    Number(input.subtotal || 0) +
    Number(input.shippingAmount || 0) +
    Number(input.taxAmount || 0) -
    Number(input.discountAmount || 0);
  return Math.round(Math.max(0, total) * 100) / 100;
}
