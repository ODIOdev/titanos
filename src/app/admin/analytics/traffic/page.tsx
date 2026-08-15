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
      <div className="border-b border-border-gray px-4 py-3 @5xl:px-5">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal">
          {title}
        </h2>
        <p className="text-xs text-medium-gray">{caption}</p>
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-10 text-center text-xs text-medium-gray">{empty}</p>
      ) : (
        <ul className="divide-y divide-border-gray">
          {rows.map((row) => (
            <li key={row.label} className="px-4 py-3 @5xl:px-5">
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <p className="min-w-0 truncate text-sm font-medium text-dark-charcoal">
                  {row.label}
                </p>
                <p className="shrink-0 text-sm font-semibold tabular-nums text-dark-charcoal">
                  {formatTrafficCount(row.pageviews)}
                  <span className="ml-1.5 text-[11px] font-medium text-medium-gray">
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
    <div className="space-y-5 @5xl:space-y-6">
      {report.message ? (
        <p
          className={cn(
            "rounded-sm border px-4 py-3 text-sm text-dark-charcoal",
            report.source === "error"
              ? "border-orange-200 bg-orange-50"
              : "border-titan-yellow/40 bg-titan-yellow/10",
          )}
        >
          {report.message}
        </p>
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-3">
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

      <section className="grid grid-cols-1 gap-3 @5xl:grid-cols-6">
        <div className="relative overflow-hidden rounded-sm border-2 border-titan-yellow bg-dark-charcoal p-5 text-white shadow-[0_10px_28px_rgba(16,24,32,0.2)] @5xl:col-span-3 @5xl:p-6">
          <div
            className="pointer-events-none absolute -right-10 -top-12 size-40 rounded-full bg-titan-yellow/20 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative flex items-start justify-between gap-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-titan-yellow">
              Visitors
            </p>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-titan-yellow text-dark-charcoal">
              <Globe className="size-5" aria-hidden="true" />
            </span>
          </div>
          <p className="relative mt-4 font-heading text-4xl font-bold tabular-nums tracking-tight text-white @5xl:text-5xl">
            {formatTrafficCount(report.visitors)}
          </p>
          <p className="relative mt-2 text-xs text-white/60">
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
          label="Top source"
          value={report.sources[0]?.label ?? "—"}
          hint={
            report.sources[0]
              ? `${formatTrafficCount(report.sources[0].pageviews)} views`
              : "Waiting on first visit"
          }
        />
      </section>

      <section className="overflow-hidden rounded-sm border border-border-gray bg-white">
        <div className="flex flex-wrap items-end justify-between gap-2 border-b border-border-gray px-4 py-3 @5xl:px-5">
          <div>
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal">
              Traffic over time
            </h2>
            <p className="text-xs text-medium-gray">
              Charcoal is visitors · yellow is page views
            </p>
          </div>
          <p className="text-xs tabular-nums text-medium-gray">
            {hasTraffic
              ? `${formatTrafficCount(report.pageviews)} views`
              : "No visits yet"}
          </p>
        </div>
        <div className="px-2 py-3 @5xl:px-4 @5xl:py-4">
          <WebTrafficChart data={report.series} />
        </div>
      </section>

      <section className="grid gap-4 @5xl:grid-cols-2">
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

      <section className="grid gap-4 @5xl:grid-cols-2">
        <div className="overflow-hidden rounded-sm border border-border-gray bg-white">
          <div className="border-b border-border-gray px-4 py-3 @5xl:px-5">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal">
              Devices
            </h2>
            <p className="text-xs text-medium-gray">Phone, desktop, tablet</p>
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
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-sm border border-border-gray bg-white px-4 py-4 @5xl:px-5 @5xl:py-5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-medium-gray">
        {label}
      </p>
      <p className="mt-3 truncate font-heading text-2xl font-semibold tabular-nums text-dark-charcoal @5xl:text-3xl">
        {value}
      </p>
      <p className="mt-1 text-xs text-medium-gray">{hint}</p>
    </div>
  );
}
