import { CartPageClient } from "@/components/cart/cart-page-client";
import { getFreeShippingThreshold } from "@/lib/data/free-shipping";

export default async function CartPage() {
  const freeShippingThreshold = await getFreeShippingThreshold();
  return <CartPageClient freeShippingThreshold={freeShippingThreshold} />;
}
