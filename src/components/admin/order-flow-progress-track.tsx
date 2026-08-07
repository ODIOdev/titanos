import Link from "next/link";
import type { ReactNode } from "react";
import {
  ORDER_PIPELINE,
  orderStageIndex,
  type OrderPipelineStage,
} from "@/lib/admin/orders-workflow";
import { cn } from "@/lib/utils";

function stageHref(stage: OrderPipelineStage, q?: string) {
  const params = new URLSearchParams();
  params.set("status", stage.statusParam);
  if (q?.trim()) params.set("q", q.trim());
  return `/admin/orders?${params.toString()}`;
}

type FleetProps = {
  variant: "fleet";
  counts: Record<string, number>;
  activeStatus: string;
  searchQuery?: string;
  className?: string;
  aboveBar?: ReactNode;
};

type OrderProps = {
  variant: "order";
  status: string;
  className?: string;
  aboveBar?: ReactNode;
};

export type OrderFlowProgressTrackProps = FleetProps | OrderProps;

/**
 * Frosted 0–100% flow meter.
 * - fleet: weighted average across open orders
 * - order: this order’s place on New → Delivered
 */
export function OrderFlowProgressTrack(props: OrderFlowProgressTrackProps) {
  const stageCount = ORDER_PIPELINE.length;
  const isFleet = props.variant === "fleet";

  const segments = ORDER_PIPELINE.map((stage, index) => ({
    stage,
    index,
    count: isFleet ? (props.counts[stage.statusParam] ?? 0) : 0,
    /** Stage midpoint on the 0–100 track. */
    atPct: ((index + 0.5) / stageCount) * 100,
    /** Stage boundary start. */
    startPct: (index / stageCount) * 100,
  }));

  const orderIndex =
    props.variant === "order" ? orderStageIndex(props.status) : -1;
  const isException =
    props.variant === "order" &&
    (props.status === "cancelled" || props.status === "refunded");

  const total = isFleet
    ? segments.reduce((sum, segment) => sum + segment.count, 0)
    : isException || orderIndex < 0
      ? 0
      : 1;

  const progressPct = isFleet
    ? total === 0
      ? 0
      : segments.reduce(
          (sum, segment) => sum + segment.count * segment.atPct,
          0,
        ) / total
    : orderIndex < 0
      ? 0
      : ((orderIndex + 0.5) / stageCount) * 100;

  const rounded = Math.round(progressPct);

  const leadingStage = isFleet
    ? total === 0
      ? null
      : segments.reduce((best, segment) =>
          segment.count > best.count ? segment : best,
        ).stage
    : orderIndex >= 0
      ? ORDER_PIPELINE[orderIndex]
      : null;

  const activeParam = isFleet
    ? props.activeStatus
    : orderIndex >= 0
      ? ORDER_PIPELINE[orderIndex].statusParam
      : "";

  const summary = isException
    ? props.status === "refunded"
      ? "Left the happy path — refunded"
      : "Left the happy path — cancelled"
    : isFleet
      ? total === 0
        ? "Pipeline clear · 0%"
        : `${total} order${total === 1 ? "" : "s"} averaged · ${
            leadingStage ? `most in ${leadingStage.label}` : "in flow"
          }`
      : orderIndex >= 0
        ? `${ORDER_PIPELINE[orderIndex].label} · stage ${orderIndex + 1} of ${stageCount}`
        : "Status unknown";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-sm border border-white/70",
        "bg-white/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_1px_2px_rgba(16,24,40,0.06)]",
        "backdrop-blur-md",
        isException && "border-red-200/80 bg-red-50/40",
        props.className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/55 via-transparent to-black/[0.04]"
        aria-hidden="true"
      />

      <div className="relative space-y-2.5 px-3 py-2.5 @5xl:px-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-medium-gray">
              Flow progress
            </p>
            <p className="mt-0.5 text-[0.65rem] text-medium-gray">{summary}</p>
          </div>
          <p
            className={cn(
              "font-heading text-2xl font-semibold tabular-nums leading-none text-dark-charcoal",
              isException && "text-red-800",
            )}
          >
            {isException ? "—" : `${rounded}%`}
          </p>
        </div>

        {props.aboveBar ? (
          <div className="@5xl:grid @5xl:grid-cols-5 @5xl:gap-2">
            <div className="w-full max-w-[11rem] @5xl:col-start-4 @5xl:max-w-none">
              {props.aboveBar}
            </div>
          </div>
        ) : null}

        <div
          className={cn(
            "relative h-3.5 overflow-hidden rounded-full border border-white/60",
            "bg-black/[0.07] shadow-[inset_0_1px_2px_rgba(16,24,40,0.1)]",
            isException && "opacity-50",
          )}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={isException ? undefined : rounded}
          aria-label={summary}
        >
          {/* Frosted empty remainder */}
          <div
            className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.28)_0%,rgba(255,255,255,0.06)_40%,rgba(16,24,40,0.08)_100%)]"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,transparent,transparent_5px,rgba(16,24,40,0.035)_5px,rgba(16,24,40,0.035)_10px)]"
            aria-hidden="true"
          />

          {/* Free-flowing fill 0 → progress% */}
          {!isException ? (
            <div
              className="absolute inset-y-0 left-0 overflow-hidden rounded-full transition-[width] duration-700 ease-out"
              style={{ width: `${progressPct}%` }}
            >
              <div
                className="absolute inset-0 bg-[linear-gradient(90deg,#f5c400_0%,#34d399_55%,#0d9488_100%)]"
                aria-hidden="true"
              />
              <div
                className="absolute inset-0 bg-gradient-to-b from-white/35 to-transparent"
                aria-hidden="true"
              />
            </div>
          ) : null}

          {/* Soft stage ticks (not hard segments) */}
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            {ORDER_PIPELINE.slice(1).map((stage, i) => (
              <span
                key={stage.id}
                className="absolute inset-y-0 w-px bg-white/50"
                style={{ left: `${((i + 1) / stageCount) * 100}%` }}
              />
            ))}
          </div>

          {/* Playhead */}
          {!isException && progressPct > 0 ? (
            <span
              className="pointer-events-none absolute top-1/2 z-10 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-dark-charcoal shadow-[0_1px_4px_rgba(16,24,40,0.35)]"
              style={{ left: `${progressPct}%` }}
              aria-hidden="true"
            />
          ) : null}
        </div>

        {/* 0–100 scale */}
        <div className="flex items-center justify-between gap-2 text-[0.65rem] tabular-nums text-medium-gray/75">
          <span className="shrink-0">0%</span>
          <ol className="flex min-w-0 flex-1 items-center justify-between px-1">
            {segments.map(({ stage, count }) => {
              const active = activeParam === stage.statusParam;
              const className = cn(
                "truncate text-center text-[0.6rem] uppercase tracking-wide transition-colors",
                active
                  ? "font-semibold text-dark-charcoal"
                  : "font-medium text-medium-gray/40 hover:text-medium-gray",
              );
              return (
                <li key={stage.id} className="min-w-0 flex-1 text-center">
                  {isFleet ? (
                    <Link
                      href={stageHref(stage, props.searchQuery)}
                      className={className}
                      aria-current={active ? "page" : undefined}
                      title={`${stage.label}: ${count}`}
                    >
                      {stage.shortLabel}
                      {count > 0 ? (
                        <span className="ml-0.5 tabular-nums text-medium-gray/60">
                          {count}
                        </span>
                      ) : null}
                    </Link>
                  ) : (
                    <span className={className}>{stage.shortLabel}</span>
                  )}
                </li>
              );
            })}
          </ol>
          <span className="shrink-0">100%</span>
        </div>
      </div>
    </div>
  );
}
