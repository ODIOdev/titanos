export type TrafficPoint = {
  date: string;
  iso: string;
  visitors: number;
  pageviews: number;
};

export type TrafficRanked = {
  label: string;
  pageviews: number;
  visitors: number;
};

export type WebTrafficReport = {
  source: "live" | "empty" | "unconfigured" | "error";
  message: string | null;
  rangeLabel: string;
  visitors: number;
  pageviews: number;
  pagesPerVisit: number;
  series: TrafficPoint[];
  pages: TrafficRanked[];
  sources: TrafficRanked[];
  devices: TrafficRanked[];
  countries: TrafficRanked[];
};

export function formatTrafficCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}
