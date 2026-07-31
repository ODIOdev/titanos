const STATUS_COLORS: Record<string, string> = {
  pending: "#f97316",
  paid: "#15803d",
  processing: "#2563eb",
  shipped: "#0ea5e9",
  delivered: "#065f46",
  cancelled: "#9ca3af",
  refunded: "#b91c1c",
};

const FALLBACK_COLORS = ["#f5c400", "#101820", "#6b7280", "#15803d", "#f97316"];

/** Chart and legend colour for an order status, stable across both surfaces. */
export function statusColor(status: string, index = 0): string {
  return (
    STATUS_COLORS[status.toLowerCase()] ??
    FALLBACK_COLORS[index % FALLBACK_COLORS.length]
  );
}
