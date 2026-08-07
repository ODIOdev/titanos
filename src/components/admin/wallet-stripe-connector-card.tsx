"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Banknote, ExternalLink, Settings2 } from "lucide-react";
import { simulateWalletDeposit } from "@/lib/actions/wallet";
import {
  API_STACK_STATUS_LABEL,
  type ApiStackReport,
} from "@/lib/data/api-stacks-shared";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn, formatCurrency } from "@/lib/utils";

const LIGHT_STYLES = {
  green: {
    badge: "bg-emerald-100 text-emerald-800",
    lamp: "bg-emerald-500",
    glow: "shadow-[0_0_10px_rgba(16,185,129,0.45)]",
  },
  yellow: {
    badge: "bg-amber-100 text-amber-900",
    lamp: "bg-amber-400",
    glow: "shadow-[0_0_10px_rgba(251,191,36,0.45)]",
  },
  red: {
    badge: "bg-red-100 text-red-800",
    lamp: "bg-red-500",
    glow: "shadow-[0_0_10px_rgba(239,68,68,0.45)]",
  },
} as const;

const PRESETS = [50, 100, 250, 500, 1000];

export function WalletStripeConnectorCard({
  stack,
}: {
  stack: ApiStackReport | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("100");
  const [pending, startTransition] = useTransition();

  const light = stack?.light ?? "red";
  const styles = LIGHT_STYLES[light];
  const statusLabel = stack
    ? API_STACK_STATUS_LABEL[light]
    : "Not connected";
  const metrics = stack?.metrics ?? [];

  function submitDeposit() {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Enter a deposit amount greater than zero.");
      return;
    }
    startTransition(async () => {
      const result = await simulateWalletDeposit({ amount: value });
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-sm border border-border-gray bg-white">
        <div className="border-b border-border-gray px-4 py-3 @3xl:px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal">
                Stripe connector
              </h2>
              <p className="text-xs text-medium-gray">
                Payments API for wallet revenue
              </p>
            </div>
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-sm px-2 py-1 text-[10px] font-semibold uppercase tracking-wide",
                styles.badge,
              )}
            >
              <span
                className={cn("size-1.5 rounded-full", styles.lamp, styles.glow)}
                aria-hidden="true"
              />
              {statusLabel}
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 px-4 py-4 @3xl:px-5">
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-sm border border-border-gray bg-light-gray">
              <Image
                src="/images/integrations/stripe.svg"
                alt=""
                width={28}
                height={28}
                className="size-7"
              />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-dark-charcoal">Stripe</p>
              <p className="text-xs text-medium-gray">
                {stack?.detail ??
                  "Configure secret, publishable, and webhook keys."}
              </p>
            </div>
          </div>

          <dl className="grid grid-cols-1 gap-2">
            {(metrics.length > 0
              ? metrics.slice(0, 4)
              : [
                  { label: "Secret", value: "—" },
                  { label: "Publishable", value: "—" },
                  { label: "Webhook", value: "—" },
                ]
            ).map((metric) => (
              <div
                key={metric.label}
                className="flex items-center justify-between gap-3 rounded-sm border border-border-gray bg-light-gray/40 px-3 py-2"
              >
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-medium-gray">
                  {metric.label}
                </dt>
                <dd className="truncate text-sm font-medium tabular-nums text-dark-charcoal">
                  {metric.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-auto flex flex-wrap gap-2 border-t border-border-gray pt-3">
            <Button
              type="button"
              size="sm"
              variant="primary"
              className="gap-1.5"
              onClick={() => setOpen(true)}
            >
              <Banknote className="size-3.5" aria-hidden="true" />
              Deposit
            </Button>
            <Link
              href="/admin/settings"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "gap-1.5",
              )}
            >
              <Settings2 className="size-3.5" aria-hidden="true" />
              Settings
            </Link>
            <a
              href={stack?.docsUrl ?? "https://dashboard.stripe.com"}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "gap-1.5",
              )}
            >
              Dashboard
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Deposit funds"
        description="Simulated Stripe deposit — credits the platform wallet balance."
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="wallet-deposit-amount"
              className="text-[11px] font-semibold uppercase tracking-wide text-medium-gray"
            >
              Amount (USD)
            </label>
            <div className="relative mt-1.5">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-medium-gray">
                $
              </span>
              <Input
                id="wallet-deposit-amount"
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7 text-base font-semibold tabular-nums"
                autoFocus
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(String(preset))}
                className={cn(
                  "rounded-sm border px-2.5 py-1.5 text-xs font-semibold tabular-nums transition-colors",
                  Number(amount) === preset
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                    : "border-border-gray bg-white text-dark-charcoal hover:border-dark-charcoal",
                )}
              >
                {formatCurrency(preset)}
              </button>
            ))}
          </div>

          <div className="flex justify-end gap-2 border-t border-border-gray pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="gap-1.5"
              onClick={submitDeposit}
              disabled={pending}
            >
              <Banknote className="size-3.5" aria-hidden="true" />
              {pending ? "Depositing…" : "Deposit"}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
