import { cn, formatCurrency } from "@/lib/utils";

export function WalletBalanceCard({
  balance,
  className,
}: {
  balance: number;
  className?: string;
}) {
  const positive = balance >= 0;

  return (
    <div
      className={cn(
        "relative col-span-2 overflow-hidden rounded-sm border-2 border-emerald-600/35 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/40 p-5 sm:p-6 xl:col-span-2",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-10 size-36 rounded-full bg-emerald-400/15 blur-2xl"
        aria-hidden="true"
      />
      <div className="relative min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">
          Balance
        </p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-medium-gray">
          Platform wallet
        </p>
      </div>

      <p
        className={cn(
          "relative mt-5 font-heading text-4xl font-bold tabular-nums tracking-tight sm:text-5xl",
          positive ? "text-emerald-700" : "text-red-700",
        )}
      >
        {formatCurrency(balance)}
      </p>
      <p className="relative mt-2 text-sm text-medium-gray">
        Exact balance of the platform · income minus expenses
      </p>
    </div>
  );
}
