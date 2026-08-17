"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { CookieConsentBanner } from "@/components/layout/cookie-consent-banner";
import { CartProvider } from "@/components/providers/cart-provider";
import { CookieConsentProvider } from "@/components/providers/cookie-consent-provider";
import { DevIphoneShell } from "@/components/dev/dev-iphone-shell";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <CookieConsentProvider>
        <DevIphoneShell>
          {children}
          <CookieConsentBanner />
        </DevIphoneShell>
      </CookieConsentProvider>
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
