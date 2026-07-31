import { Lock, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AFFILIATE_ELIGIBILITY_ORDERS } from "@/lib/data/admin";
import { cn } from "@/lib/utils";

export function AffiliatePromoCard({
  promoCode,
  discountPercent,
  couponActive,
  ordersCount,
}: {
  promoCode: string | null;
  discountPercent: number | null;
  couponActive: boolean | null;
  ordersCount: number;
}) {
  const eligible = ordersCount >= AFFILIATE_ELIGIBILITY_ORDERS;
  const remaining = Math.max(AFFILIATE_ELIGIBILITY_ORDERS - ordersCount, 0);
  const progress = Math.min(
    100,
    Math.round((ordersCount / AFFILIATE_ELIGIBILITY_ORDERS) * 100),
  );
  const discountLabel =
    discountPercent != null ? `${discountPercent}%` : "their set rate";

  return (
    <div
      className={cn(
        "rounded-sm border bg-white p-5",
        eligible
          ? "border-titan-yellow ring-1 ring-titan-yellow"
          : "border-border-gray",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal">
          Affiliate promo code
        </h3>
        {eligible ? (
          <Badge variant="sale" className="inline-flex items-center gap-1">
            <Sparkles className="size-3" aria-hidden="true" />
            Unlocked
          </Badge>
        ) : (
          <Badge className="inline-flex items-center gap-1">
            <Lock className="size-3" aria-hidden="true" />
            Locked
          </Badge>
        )}
      </div>

      <p
        className={cn(
          "mt-3 font-mono text-xl font-semibold tracking-wide",
          eligible ? "text-dark-charcoal" : "text-medium-gray",
        )}
      >
        {promoCode ?? "—"}
      </p>

      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-medium-gray">Discount</dt>
          <dd>{discountPercent != null ? `${discountPercent}%` : "—"}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-medium-gray">Status</dt>
          <dd>
            {couponActive == null ? "—" : couponActive ? "Active" : "Inactive"}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-medium-gray">Purchases</dt>
          <dd className="tabular-nums">
            {ordersCount} of {AFFILIATE_ELIGIBILITY_ORDERS}
          </dd>
        </div>
      </dl>

      {eligible ? (
        <p className="mt-4 rounded-sm bg-titan-yellow/15 px-3 py-2 text-sm font-medium text-dark-charcoal">
          Eligible — {AFFILIATE_ELIGIBILITY_ORDERS} purchases reached. This
          customer can start sharing their code.
        </p>
      ) : (
        <div className="mt-4">
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-light-gray"
            role="progressbar"
            aria-valuenow={ordersCount}
            aria-valuemin={0}
            aria-valuemax={AFFILIATE_ELIGIBILITY_ORDERS}
            aria-label="Progress toward promo code eligibility"
          >
            <div
              className="h-full rounded-full bg-dark-charcoal transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-medium-gray">
            {remaining} more purchase{remaining === 1 ? "" : "s"} until this
            customer is eligible to share their code.
          </p>
        </div>
      )}

      <div className="mt-4 border-t border-border-gray pt-4">
        <p className="font-heading text-xs font-semibold uppercase tracking-wide text-dark-charcoal">
          How the code works
        </p>
        <ol className="mt-2 space-y-1.5 text-xs text-medium-gray">
          <li>
            1. Access unlocks after {AFFILIATE_ELIGIBILITY_ORDERS} completed
            purchases. Cancelled orders don&rsquo;t count.
          </li>
          <li>
            2. The customer shares this code with their crew or contacts, who
            enter it at checkout.
          </li>
          <li>
            3. Each order using the code takes {discountLabel} off the subtotal.
            There is no usage limit or expiry date.
          </li>
          <li>
            4. Change the rate for all customers from the promo discount card on
            the Members page.
          </li>
        </ol>
        <p className="mt-3 text-xs text-medium-gray">
          Auto-generated on signup and permanently linked to this profile.
        </p>
      </div>
    </div>
  );
}
