import {
  ORDER_PIPELINE,
  orderStageIndex,
} from "@/lib/admin/orders-workflow";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

/** Horizontal (desktop) / vertical (mobile) fulfillment stepper for an order. */
export function OrderFulfillmentStepper({ status }: { status: string }) {
  const current = orderStageIndex(status);
  const isException = status === "cancelled" || status === "refunded";

  return (
    <section
      className="rounded-sm border border-border-gray bg-white p-4 @5xl:p-5"
      aria-label="Fulfillment progress"
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal @5xl:text-base">
            Fulfillment progress
          </h3>
          <p className="mt-0.5 text-xs text-medium-gray @5xl:text-sm">
            {isException
              ? status === "refunded"
                ? "This order left the happy path as a return / refund."
                : "This order was cancelled before delivery."
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

          return (
            <li
              key={stage.id}
              className={cn(
                "relative flex gap-3 @5xl:flex-col @5xl:items-center @5xl:text-center",
                "border-l-2 pl-3 @5xl:border-l-0 @5xl:pl-0",
                done
                  ? "border-emerald-500"
                  : active
                    ? "border-titan-yellow"
                    : "border-border-gray",
                index < ORDER_PIPELINE.length - 1 ? "pb-4 @5xl:pb-0" : "",
              )}
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full @5xl:size-9",
                  done
                    ? "bg-emerald-500 text-white"
                    : active
                      ? cn(stage.tone, "ring-2 ring-titan-yellow ring-offset-2")
                      : "bg-light-gray text-medium-gray",
                  isException && "opacity-40",
                )}
              >
                {done ? (
                  <Check className="size-4" aria-hidden="true" />
                ) : (
                  <Icon className="size-4" aria-hidden="true" />
                )}
              </span>
              <div className="min-w-0 pt-0.5 @5xl:pt-2">
                <p
                  className={cn(
                    "font-heading text-xs font-semibold uppercase tracking-wide",
                    upcoming && !active
                      ? "text-medium-gray"
                      : "text-dark-charcoal",
                  )}
                >
                  {stage.label}
                </p>
                <p className="mt-0.5 text-[0.65rem] text-medium-gray">
                  {stage.description}
                </p>
                {active ? (
                  <p className="mt-1 text-[0.65rem] font-semibold uppercase tracking-wide text-dark-charcoal">
                    Current
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
