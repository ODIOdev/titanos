import Link from "next/link";
import { ChevronRight } from "lucide-react";
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

      {/* Desktop / tablet: connected stage strip */}
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
      </div>

      {/* Mobile: stacked compact stages */}
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
      </div>

      <div className="grid gap-2 @3xl:grid-cols-[minmax(0,1fr)_minmax(12rem,16rem)]">
        <div className="rounded-sm border border-dashed border-border-gray bg-light-gray/50 px-3 py-2.5 text-xs text-medium-gray @5xl:px-4 @5xl:text-sm">
          <span className="font-semibold text-dark-charcoal">Flow: </span>
          New → Paid → Processing → Shipped → Delivered. Use Returns for
          refunded orders; cancel anytime before ship.
        </div>
        <StageCard
          stage={ORDER_RETURNS_STAGE}
          count={returnCount}
          active={activeStatus === "refunded"}
          q={searchQuery}
        />
      </div>
    </section>
  );
}
