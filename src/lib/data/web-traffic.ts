import type {
  TrafficPoint,
  TrafficRanked,
  WebTrafficReport,
} from "@/lib/data/web-traffic-shared";

export type {
  TrafficPoint,
  TrafficRanked,
  WebTrafficReport,
} from "@/lib/data/web-traffic-shared";
export { formatTrafficCount } from "@/lib/data/web-traffic-shared";

const RANGE_DAYS = 14;

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States",
  CA: "Canada",
  MX: "Mexico",
  GB: "United Kingdom",
  DE: "Germany",
  FR: "France",
  ES: "Spain",
  IT: "Italy",
  NL: "Netherlands",
  AU: "Australia",
  IN: "India",
  BR: "Brazil",
  JP: "Japan",
  KR: "South Korea",
  CN: "China",
  SG: "Singapore",
  AE: "United Arab Emirates",
  IE: "Ireland",
  SE: "Sweden",
  PL: "Poland",
};

type CountPayload = {
  data?: { pageviews?: number; visitors?: number };
};

type AggregateRow = {
  timestamp?: string;
  pageviews?: number;
  visitors?: number;
  requestPath?: string;
  route?: string;
  referrerHostname?: string;
  deviceType?: string;
  country?: string;
  browserName?: string;
};

type AggregatePayload = {
  data?: AggregateRow[];
};

function emptySeries(): TrafficPoint[] {
  const now = new Date();
  return Array.from({ length: RANGE_DAYS }, (_, index) => {
    const day = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    day.setUTCDate(day.getUTCDate() - (RANGE_DAYS - 1 - index));
    return {
      iso: day.toISOString().slice(0, 10),
      date: formatAxisDate(day),
      visitors: 0,
      pageviews: 0,
    };
  });
}

function formatAxisDate(day: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(day);
}

function emptyReport(
  source: WebTrafficReport["source"],
  message: string | null,
): WebTrafficReport {
  return {
    source,
    message,
    rangeLabel: "Last 14 days",
    visitors: 0,
    pageviews: 0,
    pagesPerVisit: 0,
    series: emptySeries(),
    pages: [],
    sources: [],
    devices: [],
    countries: [],
  };
}

function authHeaders(): {
  token: string;
  projectId: string;
  teamId: string | null;
} | null {
  const token =
    process.env.VERCEL_TOKEN?.trim() ||
    process.env.VERCEL_API_TOKEN?.trim() ||
    "";
  const projectId = process.env.VERCEL_PROJECT_ID?.trim() || "";
  const teamId =
    process.env.VERCEL_ORG_ID?.trim() ||
    process.env.VERCEL_TEAM_ID?.trim() ||
    null;
  if (!token || !projectId) return null;
  return { token, projectId, teamId };
}

function rangeBounds(): { since: string; until: string } {
  const until = new Date();
  const since = new Date(until);
  since.setUTCDate(since.getUTCDate() - (RANGE_DAYS - 1));
  return {
    since: since.toISOString().slice(0, 10),
    until: until.toISOString().slice(0, 10),
  };
}

async function queryJson<T>(
  path: string,
  params: Record<string, string | undefined>,
  token: string,
): Promise<T> {
  const url = new URL(`https://api.vercel.com${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 300 },
  });
  const body = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    const record =
      body && typeof body === "object" ? (body as Record<string, unknown>) : null;
    const nested =
      record?.error && typeof record.error === "object"
        ? (record.error as Record<string, unknown>)
        : null;
    const message =
      (typeof nested?.message === "string" && nested.message) ||
      (typeof record?.message === "string" && record.message) ||
      `Analytics API ${response.status}`;
    throw new Error(message);
  }
  return body as T;
}

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function mergeSeries(rows: AggregateRow[]): TrafficPoint[] {
  const byIso = new Map<string, { visitors: number; pageviews: number }>();
  for (const row of rows) {
    const iso = (row.timestamp ?? "").slice(0, 10);
    if (!iso) continue;
    const current = byIso.get(iso) ?? { visitors: 0, pageviews: 0 };
    current.visitors += num(row.visitors);
    current.pageviews += num(row.pageviews);
    byIso.set(iso, current);
  }
  return emptySeries().map((point) => {
    const found = byIso.get(point.iso);
    return found ? { ...point, ...found } : point;
  });
}

function rank(
  rows: AggregateRow[],
  labelOf: (row: AggregateRow) => string | null,
): TrafficRanked[] {
  const ranked: TrafficRanked[] = [];
  for (const row of rows) {
    const label = labelOf(row);
    if (!label) continue;
    ranked.push({
      label,
      pageviews: num(row.pageviews),
      visitors: num(row.visitors),
    });
  }
  return ranked
    .filter((row) => row.pageviews > 0 || row.visitors > 0)
    .sort((a, b) => b.pageviews - a.pageviews || b.visitors - a.visitors)
    .slice(0, 8);
}

function deviceLabel(value: string | undefined): string | null {
  if (!value) return null;
  const key = value.toLowerCase();
  if (key === "mobile" || key === "phone") return "Phone";
  if (key === "tablet") return "Tablet";
  if (key === "desktop") return "Desktop";
  if (key === "others" || key === "other") return "Other";
  return value;
}

function sourceLabel(value: string | undefined): string | null {
  if (!value || value === "null" || value === "undefined") return "Direct";
  if (value.toLowerCase() === "others" || value === "Other") return "Other";
  return value.replace(/^www\./, "");
}

function countryLabel(code: string | undefined): string | null {
  if (!code) return null;
  if (code.toLowerCase() === "others") return "Other";
  return COUNTRY_NAMES[code.toUpperCase()] ?? code.toUpperCase();
}

function pageLabel(row: AggregateRow): string | null {
  const path = row.requestPath || row.route;
  if (!path) return null;
  if (path === "/") return "Home";
  return path;
}

export async function getWebTrafficReport(): Promise<WebTrafficReport> {
  const auth = authHeaders();
  if (!auth) {
    return emptyReport(
      "unconfigured",
      "Add a Vercel access token to read live traffic here. Tracking still records visits on production.",
    );
  }

  const { since, until } = rangeBounds();
  const shared = {
    projectId: auth.projectId,
    teamId: auth.teamId ?? undefined,
    since,
    until,
  };

  try {
    const [count, daily, pages, sources, devices, countries] = await Promise.all([
      queryJson<CountPayload>(
        "/v1/query/web-analytics/visits/count",
        { ...shared },
        auth.token,
      ),
      queryJson<AggregatePayload>(
        "/v1/query/web-analytics/visits/aggregate",
        { ...shared, by: "day", limit: "30" },
        auth.token,
      ),
      queryJson<AggregatePayload>(
        "/v1/query/web-analytics/visits/aggregate",
        { ...shared, by: "requestPath", limit: "8" },
        auth.token,
      ),
      queryJson<AggregatePayload>(
        "/v1/query/web-analytics/visits/aggregate",
        { ...shared, by: "referrerHostname", limit: "8" },
        auth.token,
      ),
      queryJson<AggregatePayload>(
        "/v1/query/web-analytics/visits/aggregate",
        { ...shared, by: "deviceType", limit: "6" },
        auth.token,
      ),
      queryJson<AggregatePayload>(
        "/v1/query/web-analytics/visits/aggregate",
        { ...shared, by: "country", limit: "8" },
        auth.token,
      ),
    ]);

    const series = mergeSeries(daily.data ?? []);
    const visitors =
      series.reduce((sum, point) => sum + point.visitors, 0) ||
      num(count.data?.visitors);
    const pageviews =
      series.reduce((sum, point) => sum + point.pageviews, 0) ||
      num(count.data?.pageviews);

    const report: WebTrafficReport = {
      source: visitors === 0 && pageviews === 0 ? "empty" : "live",
      message:
        visitors === 0 && pageviews === 0
          ? "Tracking is on. Numbers appear after the first production visit."
          : null,
      rangeLabel: "Last 14 days",
      visitors,
      pageviews,
      pagesPerVisit: visitors > 0 ? Math.round((pageviews / visitors) * 10) / 10 : 0,
      series,
      pages: rank(pages.data ?? [], pageLabel),
      sources: rank(sources.data ?? [], (row) => sourceLabel(row.referrerHostname)),
      devices: rank(devices.data ?? [], (row) => deviceLabel(row.deviceType)),
      countries: rank(countries.data ?? [], (row) => countryLabel(row.country)),
    };
    return report;
  } catch (err) {
    return emptyReport(
      "error",
      err instanceof Error
        ? err.message
        : "Could not load Vercel Web Analytics.",
    );
  }
}
