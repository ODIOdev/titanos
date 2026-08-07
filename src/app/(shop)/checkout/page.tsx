import type { Metadata } from "next";
import { CheckoutClient } from "@/components/checkout/checkout-client";
import { getCheckoutProfileDefaults } from "@/lib/auth/session";
import { SITE_CONFIG } from "@/lib/data/seed-data";

export const metadata: Metadata = {
  title: "Checkout",
  description: `Secure checkout for ${SITE_CONFIG.name} — shipping address, Stripe Link, and card payments.`,
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const profileDefaults = await getCheckoutProfileDefaults();
  return <CheckoutClient profileDefaults={profileDefaults} />;
}
