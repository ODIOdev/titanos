import { formatCurrency } from "@/lib/utils";

/** Ranked bars beat a Recharts axis here: no truncation, no client JS. */
const CATEGORY_COLORS = [
  "#101820",
  "#1f2d3a",
  "#33465a",
  "#4a6076",
  "#f5c400",
  "#c79f05",
] as const;

function share(value: number, total: number): number {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

function fillWidth(value: number, max: number): string {
  return `${max > 0 ? Math.max((value / max) * 100, 2) : 0}%`;
}

export function CategorySalesBreakdown({
  data,
}: {
  data: { category: string; sales: number }[];
}) {
  const total = data.reduce((sum, row) => sum + row.sales, 0);
  const max = Math.max(...data.map((row) => row.sales), 0);

  if (data.length === 0) {
    return <EmptyState message="No category sales yet." />;
  }

  return (
    <div className="px-4 py-4 sm:px-5">
      <div className="flex items-end justify-between gap-3 border-b border-border-gray pb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-medium-gray">
            Total
          </p>
          <p className="font-heading text-2xl font-semibold text-dark-charcoal">
            {formatCurrency(total)}
          </p>
        </div>
        <p className="text-xs text-medium-gray">
          {data.length} {data.length === 1 ? "category" : "categories"}
        </p>
      </div>

      <ul className="mt-4 space-y-3.5">
        {data.map((row, index) => (
          <li key={row.category}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="truncate text-sm font-medium text-dark-charcoal">
                {row.category}
              </span>
              <span className="shrink-0 font-heading text-sm font-semibold tabular-nums text-dark-charcoal">
                {formatCurrency(row.sales)}
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-light-gray">
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: fillWidth(row.sales, max),
                    backgroundColor:
                      CATEGORY_COLORS[index % CATEGORY_COLORS.length],
                  }}
                />
              </span>
              <span className="w-8 shrink-0 text-right text-xs tabular-nums text-medium-gray">
                {share(row.sales, total)}%
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TopProductsBreakdown({
  data,
}: {
  data: { name: string; sales: number; quantity: number }[];
}) {
  const max = Math.max(...data.map((row) => row.sales), 0);
  const units = data.reduce((sum, row) => sum + row.quantity, 0);

  if (data.length === 0) {
    return <EmptyState message="No product sales yet." />;
  }

  return (
    <div className="px-4 py-4 sm:px-5">
      <div className="flex items-end justify-between gap-3 border-b border-border-gray pb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-medium-gray">
            Units sold
          </p>
          <p className="font-heading text-2xl font-semibold text-dark-charcoal">
            {units}
          </p>
        </div>
        <p className="text-xs text-medium-gray">Top {data.length} by revenue</p>
      </div>

      <ul className="mt-4 space-y-3.5">
        {data.map((row, index) => (
          <li key={row.name} className="flex items-start gap-3">
            <span
              className={
                index === 0
                  ? "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-sm bg-titan-yellow font-heading text-xs font-semibold text-dark-charcoal"
                  : "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-sm bg-light-gray font-heading text-xs font-semibold text-medium-gray"
              }
            >
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-sm font-medium text-dark-charcoal">
                  {row.name}
                </span>
                <span className="shrink-0 font-heading text-sm font-semibold tabular-nums text-dark-charcoal">
                  {formatCurrency(row.sales)}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-light-gray">
                  <span
                    className="block h-full rounded-full bg-dark-charcoal"
                    style={{ width: fillWidth(row.sales, max) }}
                  />
                </span>
                <span className="w-14 shrink-0 text-right text-xs tabular-nums text-medium-gray">
                  {row.quantity} sold
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="px-4 py-10 text-center text-sm text-medium-gray sm:px-5">
      {message}
    </p>
  );
}
