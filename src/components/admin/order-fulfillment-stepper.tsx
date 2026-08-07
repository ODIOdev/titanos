"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { OrderFlowProgressTrack } from "@/components/admin/order-flow-progress-track";
import { updateOrderStatus } from "@/lib/actions/admin";
import {
  ORDER_PIPELINE,
  orderStageIndex,
} from "@/lib/admin/orders-workflow";
import type { OrderStatus } from "@/types";
import { cn } from "@/lib/utils";
import {
  Check,
  ClipboardList,
  CreditCard,
  Loader2,
  Package,
  PackageCheck,
  Printer,
  ScanLine,
  Tag,
  Truck,
  Zap,
  type LucideIcon,
} from "lucide-react";

type StageTip = {
  title: string;
  border: string;
  bg: string;
  titleClass: string;
  iconClass: string;
  items: Array<{ icon: LucideIcon; text: string }>;
};

const STAGE_TIPS: Record<string, StageTip> = {
  pending: {
    title: "Order confirmation",
    border: "border-orange-200",
    bg: "bg-orange-50/80",
    titleClass: "text-orange-800",
    iconClass: "text-orange-600",
    items: [
      { icon: CreditCard, text: "Confirm the order" },
      { icon: ClipboardList, text: "Review ship-to & line items" },
    ],
  },
  paid: {
    title: "Pick queue",
    border: "border-emerald-200",
    bg: "bg-emerald-50/80",
    titleClass: "text-emerald-800",
    iconClass: "text-emerald-600",
    items: [
      { icon: ScanLine, text: "Pull SKUs from inventory" },
      { icon: ClipboardList, text: "Verify qty & sizes" },
    ],
  },
  processing: {
    title: "Pack station",
    border: "border-blue-200",
    bg: "bg-blue-50/80",
    titleClass: "text-blue-800",
    iconClass: "text-blue-600",
    items: [
      { icon: Package, text: "Box, weight & dimensions" },
      { icon: Tag, text: "Ready rates for label desk" },
    ],
  },
  shipped: {
    title: "ShipStation label",
    border: "border-sky-200",
    bg: "bg-sky-50/80",
    titleClass: "text-sky-800",
    iconClass: "text-sky-600",
    items: [
      { icon: Tag, text: "Rate shop via ShipEngine" },
      { icon: Printer, text: "Print before carrier handoff" },
    ],
  },
  delivered: {
    title: "Order complete",
    border: "border-teal-200",
    bg: "bg-teal-50/80",
    titleClass: "text-teal-900",
    iconClass: "text-teal-700",
    items: [
      { icon: PackageCheck, text: "Confirm customer receipt" },
      { icon: Truck, text: "Archive tracking & POD" },
    ],
  },
};

/** Horizontal (desktop) / vertical (mobile) fulfillment stepper for an order. */
export function OrderFulfillmentStepper({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const current = orderStageIndex(status);
  const isException = status === "cancelled" || status === "refunded";
  const labelDeskLive = !isException && status === "shipped";

  function jumpToStage(stageId: string, stageLabel: string) {
    if (pending) return;
    if (stageId === status) return;
    const next = stageId as OrderStatus;
    startTransition(async () => {
      const result = await updateOrderStatus(
        orderId,
        next,
        `Moved to ${stageLabel} via fulfillment progress`,
      );
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(`Order set to ${stageLabel}.`);
      router.refresh();
    });
  }

  return (
    <section
      className="rounded-sm border border-border-gray bg-white p-4 @5xl:p-5"
      aria-label="Fulfillment progress"
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal @5xl:text-base">
            Fulfillment progress
          </h3>
          <p className="text-xs text-medium-gray @5xl:text-sm">
            {isException
              ? status === "refunded"
                ? "Left happy path — refunded"
                : "Left happy path — cancelled"
              : current >= 0
                ? `Stage ${current + 1} of ${ORDER_PIPELINE.length}`
                : "Status unknown"}
          </p>
        </div>
        {isException ? (
          <span
            className={cn(
              "rounded-sm px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-wide",
              status === "refunded"
                ? "bg-red-100 text-red-900"
                : "bg-zinc-200 text-zinc-700",
            )}
          >
            {status}
          </span>
        ) : null}
      </div>

      <OrderFlowProgressTrack
        variant="order"
        status={status}
        className="mt-3"
        aboveBar={
          labelDeskLive ? (
            <div className="rounded-sm border border-sky-300 bg-[linear-gradient(160deg,#e0f2fe_0%,#ffffff_75%)] px-2 py-1">
              <div className="flex items-center justify-between gap-1">
                <p className="text-[0.55rem] font-semibold uppercase tracking-wide text-sky-800">
                  ShipStation
                </p>
                <a
                  href="#shipstation-label"
                  className="inline-flex items-center gap-0.5 text-[0.55rem] font-semibold uppercase tracking-wide text-sky-800 underline-offset-2 hover:underline"
                >
                  <Zap className="size-2.5" aria-hidden="true" />
                  Desk
                </a>
              </div>
              <p className="mt-0.5 text-[0.6rem] leading-tight text-medium-gray">
                Buy cheapest &amp; print
              </p>
            </div>
          ) : null
        }
      />

      <ol
        className={cn(
          "mt-4",
          "@5xl:grid @5xl:grid-cols-5 @5xl:gap-2",
          "flex flex-col gap-0",
        )}
      >
        {ORDER_PIPELINE.map((stage, index) => {
          const Icon = stage.icon;
          const done = !isException && current > index;
          const active = !isException && current === index;
          const upcoming = isException || current < index;
          const isShipStage = stage.id === "shipped";
          const clickable = stage.id !== status && !pending;
          const stageStatus = stage.id as OrderStatus;
          const tip = STAGE_TIPS[stage.id];
          const hideShipTipWhileLive =
            isShipStage && labelDeskLive && !isException;

          return (
            <li
              key={stage.id}
              className={cn(
                "relative flex gap-3 @5xl:flex-col @5xl:items-center @5xl:text-center",
                "border-l-2 pl-3 @5xl:border-l-0 @5xl:pl-0",
                done
                  ? "border-emerald-500"
                  : active
                    ? isShipStage
                      ? "border-sky-400"
                      : "border-titan-yellow"
                    : "border-border-gray",
                index < ORDER_PIPELINE.length - 1 ? "pb-4 @5xl:pb-0" : "",
              )}
            >
              <button
                type="button"
                disabled={!clickable}
                aria-current={active ? "step" : undefined}
                aria-label={
                  active
                    ? `${stage.label} — current stage`
                    : done
                      ? `Go back to ${stage.label}`
                      : `Jump to ${stage.label}`
                }
                title={
                  active
                    ? "Current stage"
                    : done
                      ? `Move back to ${stage.label}`
                      : `Move to ${stage.label}`
                }
                onClick={() => jumpToStage(stageStatus, stage.label)}
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full @5xl:size-9",
                  "transition-[transform,box-shadow,opacity] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow focus-visible:ring-offset-2",
                  done
                    ? "bg-emerald-500 text-white"
                    : active
                      ? cn(
                          stage.tone,
                          isShipStage
                            ? "ring-2 ring-sky-400 ring-offset-2"
                            : "ring-2 ring-titan-yellow ring-offset-2",
                        )
                      : "bg-light-gray text-medium-gray",
                  isException && !clickable && "opacity-40",
                  clickable &&
                    "cursor-pointer hover:scale-105 hover:shadow-md active:scale-95",
                  !clickable && active && "cursor-default",
                  pending && "opacity-70",
                )}
              >
                {pending && !active ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : done ? (
                  <Check className="size-4" aria-hidden="true" />
                ) : (
                  <Icon className="size-4" aria-hidden="true" />
                )}
              </button>
              <div className="min-w-0 pt-0.5 @5xl:w-full @5xl:pt-2">
                <button
                  type="button"
                  disabled={!clickable}
                  onClick={() => jumpToStage(stageStatus, stage.label)}
                  className={cn(
                    "font-heading text-xs font-semibold uppercase tracking-wide",
                    upcoming && !active
                      ? "text-medium-gray"
                      : "text-dark-charcoal",
                    clickable && "hover:underline",
                    !clickable && "cursor-default",
                  )}
                >
                  {stage.label}
                </button>
                <p className="mt-0.5 text-[0.65rem] text-medium-gray">
                  {stage.description}
                </p>
                {active ? (
                  <p
                    className={cn(
                      "mt-1 text-[0.65rem] font-semibold uppercase tracking-wide",
                      isShipStage ? "text-sky-800" : "text-dark-charcoal",
                    )}
                  >
                    Current
                  </p>
                ) : clickable ? (
                  <p className="mt-1 text-[0.6rem] font-medium uppercase tracking-wide text-medium-gray/80">
                    {done ? "Click to edit" : "Click to jump"}
                  </p>
                ) : null}

                {tip && active && !hideShipTipWhileLive ? (
                  <div
                    className={cn(
                      "mt-2 rounded-sm border px-2 py-1.5 text-left",
                      tip.border,
                      tip.bg,
                    )}
                  >
                    <p
                      className={cn(
                        "text-[0.6rem] font-semibold uppercase tracking-wide",
                        tip.titleClass,
                      )}
                    >
                      {tip.title}
                    </p>
                    <ul className="mt-1 space-y-1 text-[0.65rem] leading-snug text-medium-gray">
                      {tip.items.map((item) => {
                        const TipIcon = item.icon;
                        return (
                          <li
                            key={item.text}
                            className="flex items-start gap-1.5"
                          >
                            <TipIcon
                              className={cn(
                                "mt-0.5 size-3 shrink-0",
                                tip.iconClass,
                              )}
                              aria-hidden="true"
                            />
                            <span>{item.text}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
