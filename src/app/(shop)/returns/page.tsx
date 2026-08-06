import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Mail,
  PackageCheck,
  Phone,
  RefreshCw,
  ShieldAlert,
  Truck,
  XCircle,
} from "lucide-react";
import { ReturnsBackLink } from "@/components/layout/returns-back-link";
import { buttonVariants } from "@/components/ui/button";
import { SITE_CONFIG } from "@/lib/data/seed-data";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Returns",
  description: `Returns, exchanges, and defective-item policy for ${SITE_CONFIG.name}.`,
};

type ReturnsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const HIGHLIGHTS = [
  {
    icon: PackageCheck,
    title: "30 days",
    body: "From delivery date for most unused stock items.",
  },
  {
    icon: ClipboardList,
    title: "Original condition",
    body: "Unused, unopened, and in sellable packaging.",
  },
  {
    icon: RefreshCw,
    title: "Original payment",
    body: "Approved refunds go back to the method you used.",
  },
] as const;

const STEPS = [
  {
    title: "Request a return",
    body: `Email ${SITE_CONFIG.supportEmail} with your order number, SKU(s), quantity, and reason.`,
  },
  {
    title: "Get authorization",
    body: "We’ll confirm eligibility, share an RMA number, and give packing / label instructions.",
  },
  {
    title: "Ship it back",
    body: "Pack securely with all original packaging when possible. Include the RMA on the outside.",
  },
  {
    title: "Refund or exchange",
    body: "Once we inspect the return, refunds post in 5–10 business days. Exchanges ship when stock allows.",
  },
] as const;

const ELIGIBLE = [
  "Unused PPE and workwear still in original packaging",
  "Unopened consumables and accessories",
  "Wrong size or wrong item sent by us",
  "Defective or damaged-in-transit products (report ASAP)",
] as const;

const NOT_ELIGIBLE = [
  "Custom-printed signs, labels, and branded gear",
  "Special-order or made-to-order SKUs",
  "Used, worn, altered, or jobsite-soiled PPE",
  "Opened hygiene-sensitive items (ear plugs, respirators, etc.)",
  "Clearance / final-sale merchandise marked on the listing",
] as const;

export default async function ReturnsPage({ searchParams }: ReturnsPageProps) {
  const params = await searchParams;
  const fromRaw = typeof params.from === "string" ? params.from : undefined;

  return (
    <div className="container-titan py-10 lg:py-14">
      <div className="max-w-4xl">
        <ReturnsBackLink from={fromRaw} />

        <header className="border-b border-border-gray pb-8">
          <div className="max-w-3xl border-l-4 border-titan-yellow pl-5">
            <p className="font-heading text-[11px] font-semibold uppercase tracking-[0.2em] text-medium-gray">
              Policy
            </p>
            <h1 className="mt-2 font-heading text-4xl uppercase leading-[1.05] tracking-wide text-dark-charcoal md:text-5xl">
              Returns &amp; exchanges
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-medium-gray">
              Built for crews and jobsite buyers — clear rules, fast
              authorization, and support when something ships wrong or arrives
              defective.
            </p>
          </div>
        </header>

        <ul className="mt-8 grid gap-3 sm:grid-cols-3">
          {HIGHLIGHTS.map((item) => (
            <li
              key={item.title}
              className="border-b border-border-gray bg-light-gray/50 px-4 py-4"
            >
              <item.icon
                className="size-5 text-dark-charcoal"
                aria-hidden="true"
              />
              <p className="mt-3 font-heading text-sm uppercase tracking-wide text-dark-charcoal">
                {item.title}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-medium-gray">
                {item.body}
              </p>
            </li>
          ))}
        </ul>

        <section className="mt-12" aria-labelledby="how-to-return">
          <h2
            id="how-to-return"
            className="font-heading text-2xl uppercase tracking-wide text-dark-charcoal md:text-3xl"
          >
            How to start a return
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-medium-gray">
            Do not ship anything back until you have an RMA. Unauthorized
            returns may be refused or delayed.
          </p>

          <ol className="mt-6 grid gap-px border border-border-gray bg-border-gray sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="bg-white px-4 py-5">
                <span className="font-heading text-xs font-semibold tabular-nums text-medium-gray">
                  0{index + 1}
                </span>
                <p className="mt-2 font-heading text-sm uppercase tracking-wide text-dark-charcoal">
                  {step.title}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-medium-gray">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section
          className="mt-12 grid gap-6 lg:grid-cols-2"
          aria-labelledby="eligibility"
        >
          <div>
            <h2
              id="eligibility"
              className="flex items-center gap-2 font-heading text-xl uppercase tracking-wide text-dark-charcoal"
            >
              <CheckCircle2
                className="size-5 text-success-green"
                aria-hidden="true"
              />
              Usually eligible
            </h2>
            <ul className="mt-4 space-y-3">
              {ELIGIBLE.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 text-sm leading-relaxed text-medium-gray"
                >
                  <CheckCircle2
                    className="mt-0.5 size-4 shrink-0 text-success-green"
                    aria-hidden="true"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="flex items-center gap-2 font-heading text-xl uppercase tracking-wide text-dark-charcoal">
              <XCircle className="size-5 text-red-700" aria-hidden="true" />
              Not returnable
            </h2>
            <ul className="mt-4 space-y-3">
              {NOT_ELIGIBLE.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 text-sm leading-relaxed text-medium-gray"
                >
                  <XCircle
                    className="mt-0.5 size-4 shrink-0 text-red-700"
                    aria-hidden="true"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          className="mt-12 border border-border-gray bg-light-gray/40 px-5 py-6"
          aria-labelledby="defective-heading"
        >
          <div className="flex gap-3">
            <ShieldAlert
              className="mt-0.5 size-5 shrink-0 text-dark-charcoal"
              aria-hidden="true"
            />
            <div>
              <h2
                id="defective-heading"
                className="font-heading text-xl uppercase tracking-wide text-dark-charcoal"
              >
                Defective, damaged, or wrong item
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-medium-gray">
                Contact us within 48 hours of delivery with photos of the
                product, packaging, and packing slip. If we shipped the wrong
                SKU or the item is defective, we cover return shipping and send
                a replacement or full refund — including original shipping when
                the error is ours.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-12 grid gap-6 sm:grid-cols-2">
          <div className="border-t border-border-gray pt-5">
            <div className="flex items-center gap-2">
              <Truck className="size-4 text-dark-charcoal" aria-hidden="true" />
              <h2 className="font-heading text-lg uppercase tracking-wide text-dark-charcoal">
                Return shipping
              </h2>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-medium-gray">
              Customer-initiated returns are responsible for outbound return
              freight unless we made an error. Use a trackable carrier.
              {SITE_CONFIG.shortName} is not responsible for packages lost in
              transit without tracking.
            </p>
          </div>
          <div className="border-t border-border-gray pt-5">
            <div className="flex items-center gap-2">
              <AlertTriangle
                className="size-4 text-dark-charcoal"
                aria-hidden="true"
              />
              <h2 className="font-heading text-lg uppercase tracking-wide text-dark-charcoal">
                Bulk &amp; quote orders
              </h2>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-medium-gray">
              Crew, municipal, and quoted orders may follow the terms on your
              quote or PO. Partial returns and restocking fees can apply on
              large line items — your sales rep will confirm before the RMA is
              issued.
            </p>
          </div>
        </section>

        <section
          className="mt-14 border border-dark-charcoal bg-dark-charcoal px-5 py-7 text-white sm:px-8"
          aria-labelledby="returns-help"
        >
          <h2
            id="returns-help"
            className="font-heading text-2xl uppercase tracking-wide"
          >
            Need help with a return?
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/75">
            Have your order number ready. Most authorizations go out within one
            business day.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={`mailto:${SITE_CONFIG.supportEmail}?subject=${encodeURIComponent("Return request")}`}
              className={cn(
                buttonVariants({ variant: "primary" }),
                "inline-flex items-center gap-2",
              )}
            >
              <Mail className="size-4" aria-hidden="true" />
              Email support
            </a>
            <a
              href={`tel:${SITE_CONFIG.phone.replace(/\D/g, "")}`}
              className={cn(
                buttonVariants({ variant: "outlineInverse" }),
                "inline-flex items-center gap-2",
              )}
            >
              <Phone className="size-4" aria-hidden="true" />
              {SITE_CONFIG.phoneDisplay}
            </a>
          </div>
          <p className="mt-5 text-xs text-white/55">
            {SITE_CONFIG.supportEmail} · Hours typically Mon–Fri, 8am–5pm CT
          </p>
        </section>

        <p className="mt-8 text-sm text-medium-gray">
          Related:{" "}
          <Link
            href="/shipping"
            className="font-medium text-dark-charcoal underline-offset-2 hover:underline"
          >
            Shipping
          </Link>
          {" · "}
          <Link
            href="/faq"
            className="font-medium text-dark-charcoal underline-offset-2 hover:underline"
          >
            FAQ
          </Link>
          {" · "}
          <Link
            href="/contact"
            className="font-medium text-dark-charcoal underline-offset-2 hover:underline"
          >
            Contact
          </Link>
          {" · "}
          <Link
            href="/account/orders"
            className="font-medium text-dark-charcoal underline-offset-2 hover:underline"
          >
            Your orders
          </Link>
        </p>
      </div>
    </div>
  );
}
