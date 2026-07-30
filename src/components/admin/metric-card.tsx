import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: string;
  hint?: string;
  trend?: string;
  className?: string;
};

export function MetricCard({ label, value, hint, trend, className }: MetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-sm border border-border-gray bg-white p-4 sm:p-5",
        className,
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-medium-gray">
        {label}
      </p>
      <p className="mt-2 font-heading text-3xl font-semibold text-dark-charcoal">
        {value}
      </p>
      {(hint || trend) && (
        <div className="mt-2 flex items-center gap-2 text-sm">
          {trend ? (
            <span className="font-medium text-success-green">{trend}</span>
          ) : null}
          {hint ? <span className="text-medium-gray">{hint}</span> : null}
        </div>
      )}
    </div>
  );
}
