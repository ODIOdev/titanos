"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Activity,
  ChevronDown,
  CircleAlert,
  ExternalLink,
  RefreshCw,
  Stethoscope,
} from "lucide-react";
import { toast } from "sonner";
import { recheckApiStacks } from "@/lib/actions/admin";
import {
  buildApiStackDiagnosePrompt,
  type ApiStackLight,
  type ApiStackReport,
} from "@/lib/data/api-stacks-shared";
import { cn } from "@/lib/utils";

const LIGHT_STYLES: Record<
  ApiStackLight,
  { lamp: string; glow: string; badge: string; bar: string }
> = {
  green: {
    lamp: "bg-emerald-500",
    glow: "shadow-[0_0_12px_rgba(16,185,129,0.55)]",
    badge: "bg-emerald-100 text-emerald-800",
    bar: "bg-emerald-400",
  },
  yellow: {
    lamp: "bg-amber-400",
    glow: "shadow-[0_0_12px_rgba(251,191,36,0.55)]",
    badge: "bg-amber-100 text-amber-900",
    bar: "bg-amber-400",
  },
  red: {
    lamp: "bg-red-500",
    glow: "shadow-[0_0_12px_rgba(239,68,68,0.55)]",
    badge: "bg-red-100 text-red-800",
    bar: "bg-red-500",
  },
};

function TrafficLight({ light }: { light: ApiStackLight }) {
  return (
    <div
      className="flex flex-col gap-1 rounded-sm border border-border-gray bg-near-black px-1.5 py-1.5"
      aria-hidden="true"
      title="Sticky light — only turns green when a healthy probe confirms resolution"
    >
      {(["red", "yellow", "green"] as const).map((slot) => (
        <span
          key={slot}
          className={cn(
            "size-2.5 rounded-full",
            light === slot
              ? cn(LIGHT_STYLES[slot].lamp, LIGHT_STYLES[slot].glow)
              : "bg-white/15",
          )}
        />
      ))}
    </div>
  );
}

function SummaryDonut({
  green,
  yellow,
  red,
  total,
}: {
  green: number;
  yellow: number;
  red: number;
  total: number;
}) {
  const size = 72;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeTotal = Math.max(total, 1);

  const segments = [
    { value: green, color: "#34d399" },
    { value: yellow, color: "#fbbf24" },
    { value: red, color: "#f87171" },
  ];

  let offset = 0;

  return (
    <div className="relative size-[72px] shrink-0">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={stroke}
        />
        {segments.map((segment) => {
          if (segment.value <= 0) return null;
          const length = (segment.value / safeTotal) * circumference;
          const node = (
            <circle
              key={segment.color}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={stroke}
              strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          );
          offset += length;
          return node;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-heading text-lg font-semibold tabular-nums leading-none text-dark-charcoal">
          {total}
        </span>
        <span className="text-[9px] font-semibold uppercase tracking-wide text-medium-gray">
          stacks
        </span>
      </div>
    </div>
  );
}

function StackLogo({ stack }: { stack: ApiStackReport }) {
  if (!stack.logoUrl) {
    return (
      <span className="inline-flex size-8 items-center justify-center rounded-sm border border-border-gray bg-white text-medium-gray">
        <Activity className="size-3.5" aria-hidden="true" />
      </span>
    );
  }

  return (
    <span className="relative inline-flex size-8 items-center justify-center overflow-hidden rounded-sm border border-border-gray bg-white p-1">
      <Image
        src={stack.logoUrl}
        alt=""
        width={24}
        height={24}
        unoptimized
        className="object-contain"
      />
    </span>
  );
}

function StackRow({
  stack,
  pending,
  onDiagnose,
}: {
  stack: ApiStackReport;
  pending: boolean;
  onDiagnose: (stack: ApiStackReport) => void;
}) {
  const styles = LIGHT_STYLES[stack.light];
  const needsFix = stack.light !== "green";

  return (
    <li className="border-b border-border-gray last:border-0">
      <div className="flex items-start gap-3 px-5 py-4">
        <TrafficLight light={stack.light} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <StackLogo stack={stack} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal">
                      {stack.name}
                    </h3>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        styles.badge,
                      )}
                    >
                      {stack.statusLabel}
                    </span>
                    {stack.probedLight !== stack.light ? (
                      <span className="text-[10px] font-medium uppercase tracking-wide text-medium-gray">
                        Probe: {stack.probedLight}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-xs text-medium-gray">
                    {stack.description}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {needsFix ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => onDiagnose(stack)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-border-gray bg-white px-2.5 text-[11px] font-semibold uppercase tracking-wide text-dark-charcoal hover:bg-light-gray disabled:opacity-50"
                >
                  <Stethoscope className="size-3.5" aria-hidden="true" />
                  Diagnose
                </button>
              ) : null}
              {stack.docsUrl ? (
                <a
                  href={stack.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-medium-gray hover:text-dark-charcoal"
                >
                  Open
                  <ExternalLink className="size-3" aria-hidden="true" />
                </a>
              ) : null}
            </div>
          </div>

          <p className="mt-2 text-sm text-dark-charcoal">{stack.detail}</p>

          <div className="mt-3 grid grid-cols-3 gap-2">
            {stack.metrics.map((metric) => (
              <div
                key={metric.label}
                className="min-w-0 rounded-sm bg-light-gray/70 px-2 py-1.5"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide text-medium-gray">
                  {metric.label}
                </p>
                <p className="mt-0.5 truncate text-xs font-semibold tabular-nums text-dark-charcoal">
                  {metric.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-3 h-1 overflow-hidden rounded-full bg-light-gray">
            <div
              className={cn("h-full rounded-full", styles.bar)}
              style={{
                width:
                  stack.light === "green"
                    ? "100%"
                    : stack.light === "yellow"
                      ? "55%"
                      : "20%",
              }}
            />
          </div>
        </div>
      </div>
    </li>
  );
}

export function ApiStacksCard({
  stacks,
  summary,
  checkedAt,
}: {
  stacks: ApiStackReport[];
  summary: { green: number; yellow: number; red: number; total: number };
  checkedAt: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const checkedLabel = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(checkedAt));

  function handleDiagnose(stack: ApiStackReport) {
    const prompt = buildApiStackDiagnosePrompt(stack);
    startTransition(async () => {
      try {
        await navigator.clipboard.writeText(prompt);
        toast.success(
          `${stack.name} fix prompt copied — paste it into Cursor Agent to repair this stack.`,
          { duration: 6000 },
        );
      } catch {
        toast.message("Diagnose prompt", {
          description: prompt.slice(0, 280) + (prompt.length > 280 ? "…" : ""),
          duration: 10000,
        });
      }
    });
  }

  function handleRecheck() {
    startTransition(async () => {
      const result = await recheckApiStacks();
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
      <button
        type="button"
        aria-expanded={open}
        aria-controls="api-stacks-panel"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-start justify-between gap-3 border-b border-border-gray bg-light-gray/40 px-5 py-4 text-left transition-colors hover:bg-light-gray/70"
      >
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-sm bg-dark-charcoal text-white">
            <Activity className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-heading text-base font-semibold uppercase tracking-wide text-dark-charcoal">
                API stacks
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-sm border border-border-gray bg-white px-2 py-0.5">
                {(
                  [
                    ["green", summary.green],
                    ["yellow", summary.yellow],
                    ["red", summary.red],
                  ] as const
                ).map(([light, count]) => (
                  <span key={light} className="inline-flex items-center gap-1">
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        LIGHT_STYLES[light].lamp,
                        count > 0 && LIGHT_STYLES[light].glow,
                      )}
                    />
                    <span className="text-[10px] font-semibold tabular-nums text-medium-gray">
                      {count}
                    </span>
                  </span>
                ))}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-medium-gray">
              {open
                ? "Live status for platform integrations. Lights only turn green when a probe confirms the issue is resolved."
                : `${summary.total} stacks · checked ${checkedLabel}`}
            </p>
          </div>
        </div>
        <ChevronDown
          className={cn(
            "mt-1 ml-auto size-4 shrink-0 text-medium-gray transition-transform",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div id="api-stacks-panel">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-gray px-5 py-3">
            <p className="text-[11px] text-medium-gray">Checked {checkedLabel}</p>
            <button
              type="button"
              disabled={pending}
              onClick={handleRecheck}
              className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-border-gray bg-white px-2.5 text-[11px] font-semibold uppercase tracking-wide text-dark-charcoal hover:bg-light-gray disabled:opacity-50"
            >
              <RefreshCw
                className={cn("size-3.5", pending && "animate-spin")}
                aria-hidden="true"
              />
              Recheck
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-4 border-b border-border-gray px-5 py-4">
            <SummaryDonut {...summary} />
            <div className="grid min-w-0 flex-1 grid-cols-3 gap-2">
              {(
                [
                  ["green", "Active", summary.green],
                  ["yellow", "Problem", summary.yellow],
                  ["red", "Error", summary.red],
                ] as const
              ).map(([light, label, count]) => (
                <div
                  key={light}
                  className="rounded-sm border border-border-gray bg-white px-2.5 py-2"
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "size-2 rounded-full",
                        LIGHT_STYLES[light].lamp,
                        count > 0 && LIGHT_STYLES[light].glow,
                      )}
                    />
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-medium-gray">
                      {label}
                    </p>
                  </div>
                  <p className="mt-1 font-heading text-xl font-semibold tabular-nums text-dark-charcoal">
                    {count}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {stacks.length === 0 ? (
            <div className="flex items-start gap-2 px-5 py-6 text-sm text-medium-gray">
              <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              No API stacks registered yet.
            </div>
          ) : (
            <ul>
              {stacks.map((stack) => (
                <StackRow
                  key={stack.id}
                  stack={stack}
                  pending={pending}
                  onDiagnose={handleDiagnose}
                />
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </section>
  );
}
