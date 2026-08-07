import Link from "next/link";
import { ChevronRight, RotateCcw } from "lucide-react";
import { OrderFlowProgressTrack } from "@/components/admin/order-flow-progress-track";
import {
  ORDER_PIPELINE,
  ORDER_RETURNS_STAGE,
  type OrderPipelineStage,
} from "@/lib/admin/orders-workflow";
import { cn } from "@/lib/utils";

type OrdersPipelineProps = {
  counts: Record<string, number>;
  activeStatus: string;
  searchQuery?: string;
  returnCount: number;
};

function stageHref(stage: OrderPipelineStage, q?: string) {
  const params = new URLSearchParams();
  params.set("status", stage.statusParam);
  if (q?.trim()) params.set("q", q.trim());
  return `/admin/orders?${params.toString()}`;
}

function allHref(q?: string) {
  if (!q?.trim()) return "/admin/orders";
  return `/admin/orders?q=${encodeURIComponent(q.trim())}`;
}

function StageCard({
  stage,
  count,
  active,
  q,
  compact,
}: {
  stage: OrderPipelineStage;
  count: number;
  active: boolean;
  q?: string;
  compact?: boolean;
}) {
  const Icon = stage.icon;
  return (
    <Link
      href={stageHref(stage, q)}
      className={cn(
        "group relative flex min-w-0 flex-col rounded-sm border bg-white transition-colors",
        compact ? "gap-1.5 px-2.5 py-2" : "gap-2 p-3 @5xl:p-4",
        active
          ? "border-titan-yellow ring-1 ring-titan-yellow"
          : "border-border-gray hover:border-dark-charcoal/30",
      )}
      aria-current={active ? "page" : undefined}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-sm",
            compact ? "size-7" : "size-8 @5xl:size-9",
            stage.tone,
          )}
        >
          <Icon className={compact ? "size-3.5" : "size-4"} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.65rem] font-semibold uppercase tracking-wide text-medium-gray @5xl:text-xs">
            {compact ? stage.shortLabel : stage.label}
          </p>
          {!compact ? (
            <p className="mt-0.5 hidden truncate text-[0.65rem] text-medium-gray @5xl:block">
              {stage.description}
            </p>
          ) : null}
        </div>
        <p
          className={cn(
            "shrink-0 font-heading font-semibold tabular-nums text-dark-charcoal",
            compact ? "text-lg leading-none" : "text-xl @5xl:text-2xl",
          )}
        >
          {count}
        </p>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-light-gray">
        <div
          className={cn("h-full rounded-full transition-all", stage.barClass)}
          style={{
            width: `${count > 0 ? Math.min(100, 18 + count * 8) : 0}%`,
          }}
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}

/** Visual fulfillment pipeline + returns lane for the orders hub. */
export function OrdersPipeline({
  counts,
  activeStatus,
  searchQuery,
  returnCount,
}: OrdersPipelineProps) {
  const totalOpen =
    (counts.pending ?? 0) +
    (counts.paid ?? 0) +
    (counts.processing ?? 0) +
    (counts.shipped ?? 0);

  const happyPathFurthest = ORDER_PIPELINE.reduce(
    (far, stage, index) =>
      (counts[stage.statusParam] ?? 0) > 0 ? index : far,
    -1,
  );
  const happyPathRailPct =
    happyPathFurthest < 0
      ? 0
      : Math.min(
          80,
          ((happyPathFurthest + 0.5) / ORDER_PIPELINE.length) * 80,
        );

  return (
    <section className="space-y-3" aria-label="Order workflow">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal @5xl:text-base">
            Fulfillment pipeline
          </h2>
          <p className="mt-0.5 text-xs text-medium-gray @5xl:text-sm">
            {totalOpen > 0
              ? `${totalOpen} order${totalOpen === 1 ? "" : "s"} still moving through the floor`
              : "No open fulfillment work right now"}
          </p>
        </div>
        <Link
          href={allHref(searchQuery)}
          className={cn(
            "text-xs font-semibold uppercase tracking-wide",
            activeStatus === "all"
              ? "text-dark-charcoal"
              : "text-medium-gray hover:text-dark-charcoal",
          )}
        >
          View all
        </Link>
      </div>

      <div className="hidden @3xl:block">
        <div className="relative">
          <div
            className="pointer-events-none absolute left-6 right-6 top-[1.85rem] h-0.5 bg-border-gray"
            aria-hidden="true"
          />
          <ol className="relative grid grid-cols-5 gap-2">
            {ORDER_PIPELINE.map((stage, index) => {
              const count = counts[stage.statusParam] ?? 0;
              const active = activeStatus === stage.statusParam;
              const Icon = stage.icon;
              return (
                <li key={stage.id} className="min-w-0">
                  <Link
                    href={stageHref(stage, searchQuery)}
                    className={cn(
                      "relative flex flex-col items-center rounded-sm border bg-white px-2 py-3 text-center transition-colors",
                      active
                        ? "border-titan-yellow ring-1 ring-titan-yellow"
                        : "border-border-gray hover:border-dark-charcoal/30",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <span
                      className={cn(
                        "relative z-10 flex size-9 items-center justify-center rounded-full border-2 border-white shadow-sm",
                        stage.tone,
                      )}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <p className="mt-2 font-heading text-xs font-semibold uppercase tracking-wide text-dark-charcoal">
                      {stage.label}
                    </p>
                    <p className="mt-0.5 text-[0.65rem] text-medium-gray">
                      {stage.description}
                    </p>
                    <p className="mt-2 font-heading text-2xl font-semibold tabular-nums text-dark-charcoal">
                      {count}
                    </p>
                    {index < ORDER_PIPELINE.length - 1 ? (
                      <ChevronRight
                        className="pointer-events-none absolute -right-3 top-[1.35rem] z-10 hidden size-4 text-medium-gray/50 @5xl:block"
                        aria-hidden="true"
                      />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>

        <OrderFlowProgressTrack
          variant="fleet"
          counts={counts}
          activeStatus={activeStatus}
          searchQuery={searchQuery}
          className="mt-3"
        />
      </div>

      <div className="grid grid-cols-1 gap-1.5 @3xl:hidden">
        {ORDER_PIPELINE.map((stage) => (
          <StageCard
            key={stage.id}
            stage={stage}
            count={counts[stage.statusParam] ?? 0}
            active={activeStatus === stage.statusParam}
            q={searchQuery}
            compact
          />
        ))}
        <OrderFlowProgressTrack
          variant="fleet"
          counts={counts}
          activeStatus={activeStatus}
          searchQuery={searchQuery}
          className="mt-1"
        />
      </div>

      <div className="grid gap-2 @3xl:grid-cols-[minmax(0,1fr)_minmax(12rem,16rem)] @3xl:items-stretch">
        <div className="relative overflow-hidden rounded-sm border border-titan-yellow/40 bg-[linear-gradient(135deg,#fffdf5_0%,#ffffff_48%,#fff8e8_100%)]">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(90% 140% at 0% 40%, rgba(245,196,0,0.18), transparent 55%), radial-gradient(70% 120% at 100% 0%, rgba(245,196,0,0.08), transparent 52%)",
            }}
            aria-hidden="true"
          />
          <div className="relative px-4 py-3.5 @5xl:px-5 @5xl:py-4">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <p className="font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal @5xl:text-base">
                Payment to delivery
              </p>
              <p className="max-w-[17rem] text-right text-[0.65rem] leading-snug text-medium-gray">
                Stay on this rail unless you cancel before ship or open a
                return.
              </p>
            </div>

            <div className="relative pt-1">
              <div
                className="pointer-events-none absolute left-[10%] right-[10%] top-[18px] h-[2px] rounded-full bg-border-gray"
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute left-[10%] top-[18px] h-[2px] rounded-full bg-gradient-to-r from-titan-yellow via-[#e8b000] to-[#c99400] transition-[width] duration-700"
                style={{ width: `${happyPathRailPct}%` }}
                aria-hidden="true"
              />

              <ol className="relative grid grid-cols-5 gap-1">
                {ORDER_PIPELINE.map((stage) => {
                  const Icon = stage.icon;
                  const count = counts[stage.statusParam] ?? 0;
                  const active = activeStatus === stage.statusParam;
                  const lit = count > 0 || active;
                  return (
                    <li key={stage.id} className="min-w-0">
                      <Link
                        href={stageHref(stage, searchQuery)}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "group flex flex-col items-center text-center outline-none",
                          "rounded-sm focus-visible:ring-2 focus-visible:ring-titan-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffdf5]",
                        )}
                      >
                        <span
                          className={cn(
                            "relative z-10 flex size-9 items-center justify-center rounded-full border-2 transition-transform duration-200 group-hover:scale-105",
                            lit
                              ? "border-titan-yellow bg-titan-yellow text-near-black shadow-[0_0_0_4px_rgba(245,196,0,0.22)]"
                              : "border-border-gray bg-white text-medium-gray group-hover:border-dark-charcoal/40 group-hover:text-dark-charcoal",
                            active &&
                              "ring-2 ring-dark-charcoal/15 ring-offset-2 ring-offset-[#fffdf5]",
                          )}
                        >
                          <Icon className="size-3.5" aria-hidden="true" />
                        </span>
                        <span className="mt-2.5 font-heading text-[0.65rem] font-semibold uppercase tracking-wide text-dark-charcoal @5xl:text-xs">
                          {stage.shortLabel}
                        </span>
                        <span
                          className={cn(
                            "mt-1 font-heading text-lg font-semibold tabular-nums leading-none",
                            lit ? "text-[#b8860b]" : "text-medium-gray/45",
                          )}
                        >
                          {count}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </div>

        <Link
          href={stageHref(ORDER_RETURNS_STAGE, searchQuery)}
          aria-current={activeStatus === "refunded" ? "page" : undefined}
          className={cn(
            "group relative flex min-h-0 flex-col overflow-hidden rounded-sm border transition-all",
            "bg-[linear-gradient(160deg,#fff6ef_0%,#ffffff_52%,#ffeee3_100%)]",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(16,24,40,0.04)]",
            "hover:-translate-y-px hover:shadow-[0_6px_16px_rgba(16,24,40,0.08)]",
            activeStatus === "refunded"
              ? "border-titan-yellow ring-1 ring-titan-yellow"
              : "border-[#f0c4a8] hover:border-[#e8a87c]",
          )}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(90% 120% at 100% 0%, rgba(232,120,72,0.18), transparent 55%)",
            }}
            aria-hidden="true"
          />
          <div className="relative flex h-full flex-col gap-3 p-3.5 @5xl:p-4">
            <div className="flex items-start justify-between gap-2">
              <span className="inline-flex size-9 items-center justify-center rounded-full bg-[#fde0cc] text-[#c2410c] ring-4 ring-[#fff1e6]">
                <RotateCcw className="size-4" aria-hidden="true" />
              </span>
              <span className="rounded-sm bg-white/85 px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-[#c2410c]/90">
                Off-path
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal">
                Returns
              </p>
              <p className="mt-0.5 text-[0.65rem] leading-snug text-medium-gray">
                Refunded orders that left the delivery rail
              </p>
            </div>
            <div className="mt-auto flex items-end justify-between gap-2 border-t border-[#f3d5c0] pt-2.5">
              <div className="min-w-0 flex-1">
                <div className="h-1.5 overflow-hidden rounded-full bg-[#ffe8d6]">
                  <div
                    className="h-full rounded-full bg-[#e86f3a] transition-all"
                    style={{
                      width:
                        returnCount > 0
                          ? `${Math.min(100, 20 + returnCount * 10)}%`
                          : "0%",
                    }}
                    aria-hidden="true"
                  />
                </div>
              </div>
              <p className="font-heading text-2xl font-semibold tabular-nums leading-none text-dark-charcoal">
                {returnCount}
              </p>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
