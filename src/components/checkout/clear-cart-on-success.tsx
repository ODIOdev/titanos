"use client";

import { useEffect } from "react";
import { useCart } from "@/components/providers/cart-provider";

/** Clears the guest cart after a successful Stripe return. */
export function ClearCartOnSuccess() {
  const { clearCart, isHydrated } = useCart();

  useEffect(() => {
    if (!isHydrated) return;
    clearCart();
  }, [clearCart, isHydrated]);

  return null;
}
