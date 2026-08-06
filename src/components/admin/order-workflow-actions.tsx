"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Ban,
  CheckCircle2,
  ChevronRight,
  Package,
  RotateCcw,
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

export function OrderWorkflowActions({
  orderId,
  currentStatus,
  className,
}: {
  orderId: string;
  currentStatus: string;
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
  const canRefund =
    currentStatus !== "refunded" && currentStatus !== "cancelled";

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
      {next && nextLabel ? (
        <Button
          type="button"
          disabled={pending}
          className="w-full justify-between gap-2"
          onClick={() => apply(next, `${nextLabel} — done.`)}
        >
          <span className="inline-flex items-center gap-2">
            {NextIcon ? <NextIcon className="size-4" aria-hidden="true" /> : null}
            {pending ? "Updating…" : nextLabel}
          </span>
          <ChevronRight className="size-4 opacity-70" aria-hidden="true" />
        </Button>
      ) : isTerminal ? (
        <p className="rounded-sm border border-border-gray bg-light-gray/60 px-3 py-2.5 text-sm text-medium-gray">
          {currentStatus === "delivered"
            ? "Order complete. Use refund if the customer returns goods."
            : currentStatus === "refunded"
              ? "Return closed — refund recorded."
              : "Order cancelled — no further fulfillment."}
        </p>
      ) : null}

      {canCancel || canRefund ? (
        <div
          className={cn(
            "grid gap-2",
            canCancel && canRefund ? "grid-cols-2" : "grid-cols-1",
          )}
        >
          {canCancel ? (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              className="justify-start gap-1.5 text-xs"
              onClick={() => apply("cancelled", "Order cancelled.")}
            >
              <Ban className="size-3.5" aria-hidden="true" />
              Cancel
            </Button>
          ) : null}
          {canRefund ? (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              className="justify-start gap-1.5 text-xs"
              onClick={() => apply("refunded", "Marked as refunded.")}
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              Refund
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
