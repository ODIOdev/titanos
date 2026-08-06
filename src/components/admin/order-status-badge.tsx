import { cn } from "@/lib/utils";
import { formatOrderStatus } from "@/lib/admin/orders-workflow";

const TONE: Record<string, string> = {
  pending: "bg-orange-100 text-orange-900",
  paid: "bg-emerald-100 text-emerald-900",
  processing: "bg-blue-100 text-blue-900",
  shipped: "bg-sky-100 text-sky-900",
  delivered: "bg-teal-100 text-teal-950",
  cancelled: "bg-zinc-200 text-zinc-700",
  refunded: "bg-red-100 text-red-900",
};

export function OrderStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide",
        TONE[status] ?? "bg-light-gray text-dark-charcoal",
        className,
      )}
    >
      {formatOrderStatus(status)}
    </span>
  );
}
