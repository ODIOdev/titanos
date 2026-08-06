import Stripe from "stripe";

let stripeClient: Stripe | null = null;

/** True when a value looks like a real Stripe secret key (not a README placeholder). */
export function isValidStripeSecretKey(
  key: string | undefined | null,
): key is string {
  if (!key) return false;
  const trimmed = key.trim();
  if (!trimmed) return false;
  if (/\.\.\./.test(trimmed)) return false;
  if (/your[_-]?/i.test(trimmed)) return false;
  // Stripe secret keys: sk_test_… / sk_live_… / rk_test_… / rk_live_…
  return /^(sk|rk)_(test|live)_[A-Za-z0-9]{16,}$/.test(trimmed);
}

export function isValidStripePublishableKey(
  key: string | undefined | null,
): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  if (!trimmed || /\.\.\./.test(trimmed)) return false;
  return /^pk_(test|live)_[A-Za-z0-9]{16,}$/.test(trimmed);
}

export function isValidStripeWebhookSecret(
  key: string | undefined | null,
): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  if (!trimmed || /\.\.\./.test(trimmed)) return false;
  return /^whsec_[A-Za-z0-9+/_=-]{16,}$/.test(trimmed);
}

export function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY?.trim();
    if (!isValidStripeSecretKey(key)) {
      throw new Error("Missing STRIPE_SECRET_KEY");
    }
    stripeClient = new Stripe(key, {
      apiVersion: "2026-07-29.dahlia",
      typescript: true,
    });
  }
  return stripeClient;
}

export function isStripeConfigured(): boolean {
  return isValidStripeSecretKey(process.env.STRIPE_SECRET_KEY);
}
