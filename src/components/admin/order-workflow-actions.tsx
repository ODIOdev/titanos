"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Ban,
  CheckCircle2,
  ChevronRight,
  Package,
  Printer,
  Tag,
  Truck,
} from "lucide-react";
import { updateOrderStatus } from "@/lib/actions/admin";
import {
  nextOrderActionLabel,
  nextOrderStatus,
} from "@/lib/admin/orders-workflow";
import type { OrderStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NEXT_ICON = {
  paid: CheckCircle2,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle2,
} as const;

function ShipStationRequirement({ compact }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-sm border border-sky-200 bg-[linear-gradient(160deg,#f0f9ff_0%,#ffffff_70%)] px-3 py-2.5",
        compact && "px-2.5 py-2",
      )}
    >
      <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-sky-800">
        ShipStation label
      </p>
      <p className="mt-1 text-xs leading-snug text-medium-gray">
        Use the label desk above — buy cheapest &amp; print via ShipEngine
        (Supabase Edge).
      </p>
      <ul className="mt-2 space-y-1 text-[0.65rem] text-dark-charcoal">
        <li className="flex items-center gap-1.5">
          <Tag className="size-3 shrink-0 text-sky-600" aria-hidden="true" />
          Auto rate shop → cheapest label
        </li>
        <li className="flex items-center gap-1.5">
          <Printer
            className="size-3 shrink-0 text-sky-600"
            aria-hidden="true"
          />
          Print PDF · mark shipped
        </li>
      </ul>
      <a
        href="#shipstation-label"
        className="mt-2 inline-block text-[0.65rem] font-semibold uppercase tracking-wide text-sky-800 underline-offset-2 hover:underline"
      >
        Jump to label desk
      </a>
    </div>
  );
}

export function OrderWorkflowActions({
  orderId,
  currentStatus,
  labelDeskVisible = false,
  className,
}: {
  orderId: string;
  currentStatus: string;
  /** When the label desk is already in the rail above, skip the duplicate callout. */
  labelDeskVisible?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const next = nextOrderStatus(currentStatus);
  const nextLabel = nextOrderActionLabel(currentStatus);
  const NextIcon =
    next && next in NEXT_ICON
      ? NEXT_ICON[next as keyof typeof NEXT_ICON]
      : null;
  const isTerminal =
    currentStatus === "delivered" ||
    currentStatus === "cancelled" ||
    currentStatus === "refunded";
  const canCancel =
    currentStatus === "pending" ||
    currentStatus === "paid" ||
    currentStatus === "processing";
  const shipStationGate =
    !labelDeskVisible &&
    (currentStatus === "processing" ||
      currentStatus === "shipped" ||
      next === "shipped");

  function apply(status: OrderStatus, successNote?: string) {
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, status);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(successNote ?? result.message);
      router.refresh();
    });
  }

  return (
    <div className={cn("space-y-3", className)}>
      {shipStationGate ? <ShipStationRequirement /> : null}

      {next && nextLabel ? (
        <div className="space-y-1.5">
          <Button
            type="button"
            disabled={pending}
            className="w-full justify-between gap-2"
            onClick={() =>
              apply(
                next,
                next === "shipped"
                  ? "Marked shipped — confirm label was printed from the desk."
                  : `${nextLabel} — done.`,
              )
            }
          >
            <span className="inline-flex items-center gap-2">
              {NextIcon ? (
                <NextIcon className="size-4" aria-hidden="true" />
              ) : null}
              {pending
                ? "Updating…"
                : next === "shipped"
                  ? "Mark shipped (after label)"
                  : nextLabel}
            </span>
            <ChevronRight className="size-4 opacity-70" aria-hidden="true" />
          </Button>
          {next === "shipped" ? (
            <p className="text-[0.65rem] leading-snug text-medium-gray">
              Prefer{" "}
              <span className="font-medium">Buy cheapest &amp; print</span>{" "}
              above — it marks shipped for you.
            </p>
          ) : null}
        </div>
      ) : isTerminal ? (
        <p className="rounded-sm border border-border-gray bg-light-gray/60 px-3 py-2.5 text-sm text-medium-gray">
          {currentStatus === "delivered"
            ? "Order complete."
            : currentStatus === "refunded"
              ? "Return closed — refund recorded."
              : "Order cancelled — no further fulfillment."}
        </p>
      ) : null}

      {canCancel ? (
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          className="w-full justify-start gap-1.5 text-xs"
          onClick={() => apply("cancelled", "Order cancelled.")}
        >
          <Ban className="size-3.5" aria-hidden="true" />
          Cancel order
        </Button>
      ) : null}
    </div>
  );
}
