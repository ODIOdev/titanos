"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { BadgePercent } from "lucide-react";
import { toast } from "sonner";
import { updatePromoDiscounts } from "@/lib/actions/admin";
import type { PromoDiscountSettings } from "@/lib/data/admin";
import { Button } from "@/components/ui/button";
import { PercentInput } from "@/components/ui/percent-input";

export function PromoDiscountCard({
  settings,
}: {
  settings: PromoDiscountSettings;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [customerPercent, setCustomerPercent] = useState<number | null>(
    settings.customerPercent,
  );
  const [adminPercent, setAdminPercent] = useState<number | null>(
    settings.adminPercent,
  );

  const dirty =
    customerPercent !== settings.customerPercent ||
    adminPercent !== settings.adminPercent;
  const valid =
    customerPercent != null &&
    customerPercent > 0 &&
    adminPercent != null &&
    adminPercent > 0;

  function handleSave() {
    if (!valid) return;
    startTransition(async () => {
      const result = await updatePromoDiscounts({
        customerPercent,
        adminPercent,
      });
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  }

  return (
    <section className="overflow-hidden rounded-sm border border-border-gray bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border-gray bg-light-gray/40 px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-sm bg-titan-yellow text-near-black">
            <BadgePercent className="size-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-heading text-base font-semibold uppercase tracking-wide text-dark-charcoal">
              Promo code discounts
            </h2>
            <p className="mt-0.5 text-sm text-medium-gray">
              Discount each role&rsquo;s personal promo code applies at
              checkout. Saving re-rates every existing code.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4 p-5">
        <div className="w-full max-w-[11rem]">
          <PercentInput
            label="Customer"
            value={customerPercent}
            onValueChange={setCustomerPercent}
            hint="Affiliate codes"
          />
        </div>
        <div className="w-full max-w-[11rem]">
          <PercentInput
            label="Admin"
            value={adminPercent}
            onValueChange={setAdminPercent}
            hint="Internal crew codes"
          />
        </div>
        <Button
          type="button"
          disabled={pending || !dirty || !valid}
          onClick={handleSave}
          className="mb-7"
        >
          {pending ? "Saving…" : "Save discounts"}
        </Button>
      </div>
    </section>
  );
}
