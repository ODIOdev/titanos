import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  ClipboardList,
  HardHat,
  Package,
  Shield,
  Shirt,
  TriangleAlert,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { getResources } from "@/lib/data/resources";
import { SITE_CONFIG } from "@/lib/data/seed-data";
import { cn, formatDate } from "@/lib/utils";
import type { Resource } from "@/types";

export const metadata: Metadata = {
  title: "Resources",
  description: `PPE selection guides, traffic-control checklists, and jobsite tips from ${SITE_CONFIG.name}.`,
};

type TopicId =
  | "head-protection"
  | "hi-vis"
  | "traffic-control"
  | "fall-protection"
  | "general";

const TOPICS: {
  id: TopicId;
  label: string;
  blurb: string;
  shopHref: string;
  shopLabel: string;
  icon: typeof HardHat;
}[] = [
  {
    id: "head-protection",
    label: "Head protection",
    blurb: "Type, class, and fit — so nobody’s guessing at the trailer.",
    shopHref: "/shop/hard-hats",
    shopLabel: "Shop hard hats",
    icon: HardHat,
  },
  {
    id: "hi-vis",
    label: "Hi-vis apparel",
    blurb: "Class 2 vs Class 3 in plain language for roadway crews.",
    shopHref: "/shop/safety-vests",
    shopLabel: "Shop hi-vis",
    icon: Shirt,
  },
  {
    id: "traffic-control",
    label: "Traffic control",
    blurb: "Stage cones, signs, and PPE before the lane closes.",
    shopHref: "/shop?department=Traffic%20Control",
    shopLabel: "Shop traffic gear",
    icon: TriangleAlert,
  },
  {
    id: "fall-protection",
    label: "Fall protection",
    blurb: "Harness, connector, anchor — the basics that keep people safe up high.",
    shopHref: "/shop/fall-protection",
    shopLabel: "Shop fall gear",
    icon: Shield,
  },
];

const TOPIC_BY_SLUG: Record<string, TopicId> = {
  "ansi-hard-hat-selection-guide": "head-protection",
  "hi-vis-vest-classes-explained": "hi-vis",
  "jobsite-traffic-control-checklist": "traffic-control",
  "fall-protection-basics-for-crews": "fall-protection",
};

const QUICK_ACTIONS = [
  {
    href: "/shop",
    label: "Browse the catalog",
    body: "Rated PPE and traffic gear, ready to ship.",
    icon: Package,
  },
  {
    href: "/quote",
    label: "Get a crew quote",
    body: "Tell us the job — we’ll price kits and freight.",
    icon: ClipboardList,
  },
  {
    href: "/contact",
    label: "Talk to a real person",
    body: "Stuck on a rating? Houston sales can help.",
    icon: BookOpen,
  },
] as const;

function topicFor(resource: Resource): TopicId {
  return TOPIC_BY_SLUG[resource.slug] ?? "general";
}

function topicMeta(id: TopicId) {
  return TOPICS.find((t) => t.id === id);
}

export default async function ResourcesPage() {
  const resources = await getResources();
  const grouped = TOPICS.map((topic) => ({
    topic,
    items: resources.filter((r) => topicFor(r) === topic.id),
  })).filter((group) => group.items.length > 0);

  const uncategorized = resources.filter((r) => topicFor(r) === "general");

  return (
    <div className="bg-[linear-gradient(180deg,#fff9e6_0%,#ffffff_18rem)]">
      <div className="container-titan py-10 @5xl:py-14">
        <header className="relative overflow-hidden border border-titan-yellow/40 bg-white px-5 py-8 shadow-[0_12px_40px_rgba(245,196,0,0.12)] @3xl:px-8 @3xl:py-10">
          <div
            className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-titan-yellow/25 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-24 left-1/3 size-48 rounded-full bg-titan-yellow/15 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative max-w-3xl">
            <p className="font-heading text-[11px] font-semibold uppercase tracking-[0.22em] text-titan-yellow">
              From our team to yours
            </p>
            <h1 className="mt-3 font-heading text-4xl uppercase leading-[1.02] tracking-wide text-dark-charcoal @3xl:text-5xl">
              Guides that get
              <span className="mt-1 block text-titan-yellow">
                your crew geared right
              </span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-medium-gray @3xl:text-lg">
              No fluff — just clear answers on hard hats, hi-vis, traffic
              control, and fall gear. Written for people who buy, stage, and
              wear this stuff every day.
            </p>
            <p className="mt-4 text-sm font-medium text-dark-charcoal">
              Pick a topic below, or jump straight into a guide.
            </p>
          </div>
        </header>

        <nav
          aria-label="Jump to topic"
          className="mt-6 flex flex-wrap gap-2"
        >
          {grouped.map(({ topic }) => (
            <a
              key={topic.id}
              href={`#${topic.id}`}
              className="inline-flex items-center gap-1.5 border border-titan-yellow/50 bg-titan-yellow/15 px-3.5 py-2 text-xs font-semibold uppercase tracking-wide text-dark-charcoal transition-colors hover:border-titan-yellow hover:bg-titan-yellow"
            >
              <topic.icon className="size-3.5" aria-hidden="true" />
              {topic.label}
            </a>
          ))}
        </nav>

        <ul className="mt-6 grid gap-3 @3xl:grid-cols-3">
          {QUICK_ACTIONS.map((action) => (
            <li key={action.href}>
              <Link
                href={action.href}
                className="group flex h-full items-start gap-3 border border-border-gray bg-white px-4 py-3.5 shadow-[0_4px_18px_rgba(16,24,32,0.04)] transition-[border-color,box-shadow,background-color] hover:border-titan-yellow hover:bg-[#fffdf5] hover:shadow-[0_8px_24px_rgba(245,196,0,0.14)]"
              >
                <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center bg-titan-yellow text-dark-charcoal transition-transform group-hover:scale-105">
                  <action.icon className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-dark-charcoal">
                    {action.label}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-medium-gray">
                    {action.body}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-14 space-y-14">
          {grouped.map(({ topic, items }) => (
            <section
              key={topic.id}
              id={topic.id}
              aria-labelledby={`${topic.id}-heading`}
              className="scroll-mt-24"
            >
              <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-titan-yellow/35 pb-4">
                <div className="max-w-xl">
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex size-8 items-center justify-center bg-titan-yellow/25 text-dark-charcoal">
                      <topic.icon className="size-4" aria-hidden="true" />
                    </span>
                    <h2
                      id={`${topic.id}-heading`}
                      className="font-heading text-xl uppercase tracking-wide text-dark-charcoal"
                    >
                      {topic.label}
                    </h2>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-medium-gray">
                    {topic.blurb}
                  </p>
                </div>
                <Link
                  href={topic.shopHref}
                  className="inline-flex items-center gap-1.5 bg-titan-yellow px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-dark-charcoal transition-colors hover:bg-[#e0b400]"
                >
                  {topic.shopLabel}
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              </div>

              <ul className="mt-4 space-y-3">
                {items.map((resource) => (
                  <li key={resource.id}>
                    <Link
                      href={`/resources/${resource.slug}`}
                      className="group flex flex-col gap-3 border border-border-gray border-l-4 border-l-titan-yellow/70 bg-white px-4 py-5 transition-[border-color,background-color,box-shadow] hover:border-titan-yellow hover:border-l-titan-yellow hover:bg-[#fffdf5] hover:shadow-[0_10px_28px_rgba(245,196,0,0.12)] @3xl:flex-row @3xl:items-center @3xl:justify-between @3xl:gap-8 @3xl:px-5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-titan-yellow">
                          Field guide · {formatDate(resource.created_at)}
                        </p>
                        <h3 className="mt-1.5 font-heading text-xl uppercase tracking-wide text-dark-charcoal">
                          {resource.title}
                        </h3>
                        {resource.excerpt ? (
                          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-medium-gray">
                            {resource.excerpt}
                          </p>
                        ) : null}
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1.5 self-start text-sm font-semibold text-dark-charcoal @3xl:self-center">
                        Read this guide
                        <ArrowRight
                          className="size-3.5 transition-transform group-hover:translate-x-0.5"
                          aria-hidden="true"
                        />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {uncategorized.length > 0 ? (
            <section aria-labelledby="more-guides-heading">
              <h2
                id="more-guides-heading"
                className="border-b-2 border-titan-yellow/35 pb-4 font-heading text-xl uppercase tracking-wide text-dark-charcoal"
              >
                More guides
              </h2>
              <ul className="mt-4 space-y-3">
                {uncategorized.map((resource) => {
                  const meta = topicMeta(topicFor(resource));
                  return (
                    <li key={resource.id}>
                      <Link
                        href={`/resources/${resource.slug}`}
                        className="group flex flex-col gap-3 border border-border-gray border-l-4 border-l-titan-yellow/70 bg-white px-4 py-5 transition-colors hover:border-titan-yellow hover:bg-[#fffdf5] @3xl:flex-row @3xl:items-center @3xl:justify-between @3xl:gap-8"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-titan-yellow">
                            {meta?.label ?? "Guide"} ·{" "}
                            {formatDate(resource.created_at)}
                          </p>
                          <h3 className="mt-1.5 font-heading text-xl uppercase tracking-wide text-dark-charcoal">
                            {resource.title}
                          </h3>
                          {resource.excerpt ? (
                            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-medium-gray">
                              {resource.excerpt}
                            </p>
                          ) : null}
                        </div>
                        <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-dark-charcoal">
                          Read this guide
                          <ArrowRight className="size-3.5" aria-hidden="true" />
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
        </div>

        <aside className="relative mt-14 overflow-hidden bg-dark-charcoal px-5 py-8 text-white @3xl:flex @3xl:items-center @3xl:justify-between @3xl:gap-10 @3xl:px-8 @3xl:py-10">
          <div
            className="pointer-events-none absolute -right-10 top-0 size-40 bg-titan-yellow/20 blur-2xl"
            aria-hidden="true"
          />
          <div className="relative max-w-xl">
            <p className="font-heading text-[11px] font-semibold uppercase tracking-[0.2em] text-titan-yellow">
              We’re here when you’re ready
            </p>
            <p className="mt-3 font-heading text-2xl uppercase leading-tight tracking-wide">
              Know the rating? Let’s outfit the whole crew.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/75">
              Send the list — we’ll help with kits, volume pricing, and freight
              so gear shows up when the job starts.
            </p>
          </div>
          <div className="relative mt-6 flex flex-wrap gap-2 @3xl:mt-0 @3xl:shrink-0">
            <Link
              href="/quote"
              className={cn(
                buttonVariants({ variant: "primary", size: "md" }),
                "border border-titan-yellow",
              )}
            >
              Request a quote
            </Link>
            <Link
              href="/contact"
              className={cn(
                buttonVariants({ variant: "outlineInverse", size: "md" }),
                "border-white/35 text-white hover:border-titan-yellow hover:bg-titan-yellow/10 hover:text-titan-yellow",
              )}
            >
              Contact sales
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
