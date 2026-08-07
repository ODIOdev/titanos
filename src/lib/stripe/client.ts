import { loadStripe, type Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null> | null = null;

function isValidPublishableKey(key: string | undefined | null): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  if (!trimmed || /\.\.\./.test(trimmed)) return false;
  return /^pk_(test|live)_[A-Za-z0-9]{16,}$/.test(trimmed);
}

export function getStripePublishableKey() {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() || "";
}

export function isStripePublishableConfigured() {
  return isValidPublishableKey(getStripePublishableKey());
}

export function getStripeJs() {
  const key = getStripePublishableKey();
  if (!isValidPublishableKey(key)) return Promise.resolve(null);
  if (!stripePromise) {
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}
