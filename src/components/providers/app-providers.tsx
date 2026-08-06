"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { CartProvider } from "@/components/providers/cart-provider";
import { DevIphoneShell } from "@/components/dev/dev-iphone-shell";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <DevIphoneShell>{children}</DevIphoneShell>
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          className: "font-sans",
        }}
      />
    </CartProvider>
  );
}
