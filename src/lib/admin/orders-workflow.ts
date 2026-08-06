import type { OrderStatus } from "@/types";
import {
  CheckCircle2,
  CreditCard,
  Package,
  PackageCheck,
  RotateCcw,
  Truck,
  type LucideIcon,
} from "lucide-react";

export type OrderPipelineStage = {
  id: OrderStatus | "returns";
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  /** Filter query for the orders list */
  statusParam: string;
  tone: string;
  barClass: string;
};

/** Happy-path fulfillment stages shown in the pipeline graphic. */
export const ORDER_PIPELINE: OrderPipelineStage[] = [
  {
    id: "pending",
    label: "New",
    shortLabel: "New",
    description: "Awaiting payment",
    icon: CreditCard,
    statusParam: "pending",
    tone: "bg-orange-100 text-orange-800",
    barClass: "bg-orange-400",
  },
  {
    id: "paid",
    label: "Paid",
    shortLabel: "Paid",
    description: "Ready to pick",
    icon: CheckCircle2,
    statusParam: "paid",
    tone: "bg-emerald-100 text-emerald-800",
    barClass: "bg-emerald-500",
  },
  {
    id: "processing",
    label: "Processing",
    shortLabel: "Pack",
    description: "Picking & packing",
    icon: Package,
    statusParam: "processing",
    tone: "bg-blue-100 text-blue-800",
    barClass: "bg-blue-500",
  },
  {
    id: "shipped",
    label: "Shipped",
    shortLabel: "Ship",
    description: "In transit",
    icon: Truck,
    statusParam: "shipped",
    tone: "bg-sky-100 text-sky-800",
    barClass: "bg-sky-400",
  },
  {
    id: "delivered",
    label: "Delivered",
    shortLabel: "Done",
    description: "Complete",
    icon: PackageCheck,
    statusParam: "delivered",
    tone: "bg-teal-100 text-teal-900",
    barClass: "bg-teal-600",
  },
];

export const ORDER_RETURNS_STAGE: OrderPipelineStage = {
  id: "returns",
  label: "Returns",
  shortLabel: "Returns",
  description: "Refunded orders",
  icon: RotateCcw,
  statusParam: "refunded",
  tone: "bg-red-100 text-red-800",
  barClass: "bg-red-500",
};

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "paid",
  paid: "processing",
  processing: "shipped",
  shipped: "delivered",
};

const NEXT_ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
  pending: "Mark paid",
  paid: "Start processing",
  processing: "Mark shipped",
  shipped: "Mark delivered",
};

const STAGE_INDEX: Record<string, number> = {
  pending: 0,
  paid: 1,
  processing: 2,
  shipped: 3,
  delivered: 4,
  cancelled: -1,
  refunded: -1,
};

export function nextOrderStatus(status: string): OrderStatus | null {
  return NEXT_STATUS[status as OrderStatus] ?? null;
}

export function nextOrderActionLabel(status: string): string | null {
  return NEXT_ACTION_LABEL[status as OrderStatus] ?? null;
}

export function orderStageIndex(status: string): number {
  return STAGE_INDEX[status] ?? -1;
}

export function orderNeedsAttention(status: string): boolean {
  return status === "pending" || status === "paid" || status === "processing";
}

export function formatOrderStatus(status: string): string {
  return status.replace(/_/g, " ");
}
