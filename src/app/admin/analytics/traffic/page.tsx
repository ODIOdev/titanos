import Link from "next/link";
import { Globe, Wallet } from "lucide-react";
import { WebTrafficChart } from "@/components/admin/web-traffic-chart";
import { WebTrafficDeviceChart } from "@/components/admin/web-traffic-device-chart";
import { buttonVariants } from "@/components/ui/button";
import {
  formatTrafficCount,
  type TrafficRanked,
} from "@/lib/data/web-traffic-shared";
import { getWebTrafficReport } from "@/lib/data/web-traffic";
import { cn } from "@/lib/utils";

function share(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((value / total) * 1000) / 10;
}

function RankedList({
  title,
  caption,
  rows,
  empty,
}: {
  title: string;
  caption: string;
  rows: TrafficRanked[];
  empty: string;
}) {
  const max = rows[0]?.pageviews ?? 0;
  const total = rows.reduce((sum, row) => sum + row.pageviews, 0);

  return (
    <section className="overflow-hidden rounded-sm border border-border-gray bg-white">
      <div className="border-b border-border-gray px-3 py-2.5 @5xl:px-5 @5xl:py-3">
        <h2 className="font-heading text-xs font-semibold uppercase tracking-wide text-dark-charcoal @5xl:text-sm">
          {title}
        </h2>
        <p className="text-[11px] text-medium-gray @5xl:text-xs">{caption}</p>
      </div>
      {rows.length === 0 ? (
        <p className="px-3 py-8 text-center text-[11px] text-medium-gray @5xl:px-4 @5xl:py-10 @5xl:text-xs">
          {empty}
        </p>
      ) : (
        <ul className="divide-y divide-border-gray">
          {rows.map((row) => (
            <li key={row.label} className="px-3 py-2.5 @5xl:px-5 @5xl:py-3">
              <div className="mb-1 flex items-baseline justify-between gap-2 @5xl:mb-1.5 @5xl:gap-3">
                <p className="min-w-0 truncate text-[13px] font-medium text-dark-charcoal @5xl:text-sm">
                  {row.label}
                </p>
                <p className="shrink-0 text-[13px] font-semibold tabular-nums text-dark-charcoal @5xl:text-sm">
                  {formatTrafficCount(row.pageviews)}
                  <span className="ml-1 text-[10px] font-medium text-medium-gray @5xl:ml-1.5 @5xl:text-[11px]">
                    {share(row.pageviews, total)}%
                  </span>
                </p>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-light-gray">
                <div
                  className="h-full rounded-full bg-dark-charcoal"
                  style={{
                    width: `${max > 0 ? Math.max((row.pageviews / max) * 100, 4) : 0}%`,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function AdminWebTrafficPage() {
  const report = await getWebTrafficReport();
  const hasTraffic = report.visitors > 0 || report.pageviews > 0;

  return (
    <div className="min-w-0 space-y-3 overflow-x-hidden @5xl:space-y-6">
      {report.message ? (
        <p
          className={cn(
            "rounded-sm border px-3 py-2.5 text-[13px] leading-snug text-dark-charcoal @5xl:px-4 @5xl:py-3 @5xl:text-sm",
            report.source === "error"
              ? "border-orange-200 bg-orange-50"
              : "border-titan-yellow/40 bg-titan-yellow/10",
          )}
        >
          {report.message}
        </p>
      ) : null}

      <div className="hidden flex-wrap items-end justify-between gap-3 @5xl:flex">
        <div className="min-w-0 max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-medium-gray">
            Storefront · {report.rangeLabel}
          </p>
          <p className="mt-1 text-sm text-medium-gray">
            Who visits the shop, which pages they open, and how they arrived —
            one screen, no noise.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/wallet"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-1.5",
            )}
          >
            <Wallet className="size-3.5" aria-hidden="true" />
            Wallet
          </Link>
          <Link
            href="/admin/analytics/traffic"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-1.5 border-titan-yellow ring-1 ring-titan-yellow",
            )}
            aria-current="page"
          >
            <Globe className="size-3.5" aria-hidden="true" />
            Web analytics
          </Link>
        </div>
      </div>

      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-medium-gray @5xl:hidden">
        Storefront · {report.rangeLabel}
      </p>

      <section className="grid grid-cols-2 gap-2 @5xl:grid-cols-6 @5xl:gap-3">
        <div className="relative col-span-2 overflow-hidden rounded-sm border-2 border-titan-yellow bg-dark-charcoal p-3.5 text-white shadow-[0_10px_28px_rgba(16,24,32,0.2)] @5xl:col-span-3 @5xl:p-6">
          <div
            className="pointer-events-none absolute -right-10 -top-12 size-28 rounded-full bg-titan-yellow/20 blur-3xl @5xl:size-40"
            aria-hidden="true"
          />
          <div className="relative flex items-start justify-between gap-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-titan-yellow @5xl:text-[11px]">
              Visitors
            </p>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-titan-yellow text-dark-charcoal @5xl:size-10">
              <Globe className="size-4 @5xl:size-5" aria-hidden="true" />
            </span>
          </div>
          <p className="relative mt-2 font-heading text-3xl font-bold tabular-nums tracking-tight text-white @5xl:mt-4 @5xl:text-5xl">
            {formatTrafficCount(report.visitors)}
          </p>
          <p className="relative mt-1 text-[11px] text-white/60 @5xl:mt-2 @5xl:text-xs">
            Unique people · {report.rangeLabel.toLowerCase()}
          </p>
        </div>
        <StatTile
          label="Page views"
          value={formatTrafficCount(report.pageviews)}
          hint="Every storefront load"
        />
        <StatTile
          label="Pages / visit"
          value={
            report.pagesPerVisit > 0 ? report.pagesPerVisit.toFixed(1) : "—"
          }
          hint="How deep people browse"
        />
        <StatTile
          className="col-span-2 @5xl:col-span-1"
          label="Top source"
          value={report.sources[0]?.label ?? "—"}
          hint={
            report.sources[0]
              ? `${formatTrafficCount(report.sources[0].pageviews)} views`
              : "Waiting on first visit"
          }
        />
      </section>

      <section className="min-w-0 overflow-hidden rounded-sm border border-border-gray bg-white">
        <div className="flex items-end justify-between gap-2 border-b border-border-gray px-3 py-2.5 @5xl:px-5 @5xl:py-3">
          <div className="min-w-0">
            <h2 className="font-heading text-xs font-semibold uppercase tracking-wide text-dark-charcoal @5xl:text-sm">
              Traffic over time
            </h2>
            <p className="text-[11px] text-medium-gray @5xl:text-xs">
              <span className="@5xl:hidden">Visitors · views</span>
              <span className="hidden @5xl:inline">
                Charcoal is visitors · yellow is page views
              </span>
            </p>
          </div>
          <p className="shrink-0 text-[11px] tabular-nums text-medium-gray @5xl:text-xs">
            {hasTraffic
              ? `${formatTrafficCount(report.pageviews)} views`
              : "No visits yet"}
          </p>
        </div>
        <div className="min-w-0 px-1 py-2 @5xl:hidden">
          <WebTrafficChart data={report.series} height={176} compact />
        </div>
        <div className="hidden min-w-0 px-2 py-3 @5xl:block @5xl:px-4 @5xl:py-4">
          <WebTrafficChart data={report.series} />
        </div>
      </section>

      <section className="grid gap-3 @5xl:grid-cols-2 @5xl:gap-4">
        <RankedList
          title="Top pages"
          caption="Where people spend time"
          rows={report.pages}
          empty="Pages rank here after traffic starts."
        />
        <RankedList
          title="Sources"
          caption="How people found the shop"
          rows={report.sources}
          empty="Referrers appear once visits are recorded."
        />
      </section>

      <section className="grid gap-3 @5xl:grid-cols-2 @5xl:gap-4">
        <div className="overflow-hidden rounded-sm border border-border-gray bg-white">
          <div className="border-b border-border-gray px-3 py-2.5 @5xl:px-5 @5xl:py-3">
            <h2 className="font-heading text-xs font-semibold uppercase tracking-wide text-dark-charcoal @5xl:text-sm">
              Devices
            </h2>
            <p className="text-[11px] text-medium-gray @5xl:text-xs">
              Phone, desktop, tablet
            </p>
          </div>
          <WebTrafficDeviceChart data={report.devices} />
        </div>
        <RankedList
          title="Countries"
          caption="Where visitors are browsing from"
          rows={report.countries}
          empty="Geography fills in with live traffic."
        />
      </section>
    </div>
  );
}

function StatTile({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: string;
  hint: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-sm border border-border-gray bg-white px-3 py-2.5 @5xl:px-5 @5xl:py-5",
        className,
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-medium-gray @5xl:text-[11px]">
        {label}
      </p>
      <p className="mt-1.5 truncate font-heading text-lg font-semibold tabular-nums text-dark-charcoal @5xl:mt-3 @5xl:text-3xl">
        {value}
      </p>
      <p className="mt-0.5 truncate text-[11px] text-medium-gray @5xl:mt-1 @5xl:text-xs">
        {hint}
      </p>
    </div>
  );
}
