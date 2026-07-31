import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgeCheck,
  ClipboardCheck,
  Clock,
  Copy,
  Lock,
  Megaphone,
  ShieldCheck,
  ShoppingBag,
  Users,
} from "lucide-react";
import { AffiliateApplicationForm } from "@/components/affiliates/affiliate-application-form";
import { buttonVariants } from "@/components/ui/button";
import {
  AFFILIATE_ELIGIBILITY_ORDERS,
  getAffiliateProgramState,
} from "@/lib/data/affiliates";
import { SITE_CONFIG } from "@/lib/data/seed-data";
import { cn, formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Affiliate program",
  description: `Share your ${SITE_CONFIG.name} promo code and earn rewards on every crew order it brings in.`,
};

const STEPS = [
  {
    icon: ShoppingBag,
    title: `Place ${AFFILIATE_ELIGIBILITY_ORDERS} orders`,
    description: `Affiliate accounts open to customers with ${AFFILIATE_ELIGIBILITY_ORDERS} completed orders, so you know the gear before you recommend it.`,
  },
  {
    icon: ClipboardCheck,
    title: "Apply below",
    description:
      "Tell us where you'll share your code and who your audience is. It takes about two minutes.",
  },
  {
    icon: BadgeCheck,
    title: "Get approved",
    description:
      "Our team reviews applications weekly and activates your personal promo code once approved.",
  },
  {
    icon: Megaphone,
    title: "Share and earn",
    description:
      "Every order placed with your code gives your crew a discount and credits the sale to you.",
  },
];

const RULES = [
  "Your code is personal — it's tied to your account and cannot be transferred.",
  "Codes may not be posted to coupon aggregator or deal-scraping sites.",
  "Discounts apply to catalog pricing and cannot be stacked with quote pricing.",
  "We may deactivate a code for misuse, chargebacks, or repeated returns.",
];

function ProgressBar({ current, target }: { current: number; target: number }) {
  const pct = Math.min(100, Math.round((current / target) * 100));
  return (
    <div className="mt-3">
      <div className="h-2 w-full overflow-hidden rounded-full bg-light-gray">
        <div
          className="h-full rounded-full bg-titan-yellow transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-sm text-medium-gray">
        {current} of {target} qualifying orders
      </p>
    </div>
  );
}

function StatusCard({
  icon: Icon,
  tone,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: "pending" | "approved" | "locked";
  title: string;
  children: React.ReactNode;
}) {
  const tones = {
    pending: "border-warning-orange/40 bg-warning-orange/5",
    approved: "border-success-green/40 bg-success-green/5",
    locked: "border-border-gray bg-light-gray",
  } as const;
  const iconTones = {
    pending: "text-warning-orange",
    approved: "text-success-green",
    locked: "text-medium-gray",
  } as const;

  return (
    <div className={cn("rounded-sm border p-6", tones[tone])}>
      <Icon className={cn("size-8", iconTones[tone])} aria-hidden="true" />
      <h2 className="mt-3 font-heading text-xl uppercase tracking-wide text-dark-charcoal">
        {title}
      </h2>
      <div className="mt-2 space-y-3 text-sm text-medium-gray">{children}</div>
    </div>
  );
}

export default async function AffiliatesPage() {
  const state = await getAffiliateProgramState();
  const status = state.application?.status ?? null;

  return (
    <div>
      <section className="bg-dark-charcoal py-14 lg:py-20">
        <div className="container-titan max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-titan-yellow">
            Affiliate program
          </p>
          <h1 className="mt-3 font-heading text-4xl uppercase tracking-wide text-white md:text-5xl">
            Get paid to outfit your crew
          </h1>
          <p className="mt-4 text-lg text-white/75">
            Loyal {SITE_CONFIG.name} customers can earn a personal promo code
            worth {state.discountPercent}% off for everyone they share it with.
            Recommend the gear you already trust and get credit for every order
            it brings in.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="#apply"
              className={cn(buttonVariants({ variant: "primary", size: "lg" }))}
            >
              Apply now
            </Link>
            <Link
              href="#how-it-works"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white",
              )}
            >
              How it works
            </Link>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="container-titan py-14 lg:py-16">
        <h2 className="font-heading text-3xl uppercase tracking-wide text-dark-charcoal">
          How the program works
        </h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <li key={step.title}>
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-8 items-center justify-center rounded-full bg-dark-charcoal font-heading text-sm text-titan-yellow">
                    {index + 1}
                  </span>
                  <Icon
                    className="size-6 text-titan-yellow"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="mt-4 font-heading text-lg uppercase tracking-wide text-dark-charcoal">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-medium-gray">
                  {step.description}
                </p>
              </li>
            );
          })}
        </ol>
      </section>

      <section
        id="apply"
        className="border-t border-border-gray bg-light-gray py-14 lg:py-16"
      >
        <div className="container-titan grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="rounded-sm border border-border-gray bg-white p-6 sm:p-8">
            {!state.signedIn ? (
              <div>
                <Users className="size-8 text-titan-yellow" aria-hidden="true" />
                <h2 className="mt-3 font-heading text-2xl uppercase tracking-wide text-dark-charcoal">
                  Sign in to apply
                </h2>
                <p className="mt-2 text-sm text-medium-gray">
                  Applications are tied to your order history, so you&apos;ll
                  need to sign in first. New here? Create an account and start
                  building toward the {AFFILIATE_ELIGIBILITY_ORDERS}-order
                  threshold.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/login?redirect=/affiliates"
                    className={cn(buttonVariants({ variant: "primary" }))}
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    className={cn(buttonVariants({ variant: "outline" }))}
                  >
                    Create account
                  </Link>
                </div>
              </div>
            ) : status === "approved" ? (
              <StatusCard
                icon={BadgeCheck}
                tone="approved"
                title="You're an approved affiliate"
              >
                <p>
                  Share the code below. Anyone who uses it gets{" "}
                  {state.discountPercent}% off their order, and the sale is
                  credited to your account.
                </p>
                {state.promoCode ? (
                  <p className="inline-flex items-center gap-2 rounded-sm border border-dashed border-dark-charcoal/30 bg-white px-4 py-3 font-mono text-lg font-semibold tracking-wider text-dark-charcoal">
                    <Copy className="size-4" aria-hidden="true" />
                    {state.promoCode}
                  </p>
                ) : null}
                <p>
                  Track the orders it brings in from your{" "}
                  <Link
                    href="/account"
                    className="font-medium text-dark-charcoal underline-offset-2 hover:underline"
                  >
                    account dashboard
                  </Link>
                  .
                </p>
              </StatusCard>
            ) : status === "pending" ? (
              <StatusCard
                icon={Clock}
                tone="pending"
                title="Application under review"
              >
                <p>
                  We received your application on{" "}
                  {formatDate(state.application!.created_at)}. Our team reviews
                  new affiliates weekly and confirms approval by email.
                </p>
                {!state.eligible ? (
                  <div>
                    <p>
                      Approval happens once you reach{" "}
                      {AFFILIATE_ELIGIBILITY_ORDERS} completed orders — keep
                      shopping to close the gap.
                    </p>
                    <ProgressBar
                      current={state.ordersCount}
                      target={AFFILIATE_ELIGIBILITY_ORDERS}
                    />
                  </div>
                ) : (
                  <p>
                    You&apos;ve met the {AFFILIATE_ELIGIBILITY_ORDERS}-order
                    threshold, so you&apos;re in the final review queue.
                  </p>
                )}
              </StatusCard>
            ) : (
              <div>
                <h2 className="font-heading text-2xl uppercase tracking-wide text-dark-charcoal">
                  {status === "declined" ? "Apply again" : "Apply now"}
                </h2>
                <p className="mt-2 text-sm text-medium-gray">
                  {status === "declined"
                    ? "Your last application wasn't approved. You're welcome to update your details and resubmit."
                    : `Applications are open to every customer. Approval happens once you reach ${AFFILIATE_ELIGIBILITY_ORDERS} completed orders.`}
                </p>
                {status === "declined" && state.application?.admin_note ? (
                  <p className="mt-4 rounded-sm border border-border-gray bg-light-gray p-4 text-sm text-medium-gray">
                    <span className="font-semibold text-dark-charcoal">
                      Note from our team:{" "}
                    </span>
                    {state.application.admin_note}
                  </p>
                ) : null}
                {!state.eligible ? (
                  <div className="mt-6 rounded-sm border border-border-gray bg-light-gray p-4">
                    <p className="flex items-center gap-2 font-heading text-sm uppercase tracking-wide text-dark-charcoal">
                      <Lock className="size-4" aria-hidden="true" />
                      Your progress
                    </p>
                    <ProgressBar
                      current={state.ordersCount}
                      target={AFFILIATE_ELIGIBILITY_ORDERS}
                    />
                    <p className="mt-2 text-sm text-medium-gray">
                      You can apply today — we&apos;ll hold your application
                      until you hit the threshold.
                    </p>
                  </div>
                ) : null}
                <div className="mt-6">
                  <AffiliateApplicationForm
                    defaultValues={{
                      contactName: state.contact?.name ?? "",
                      email: state.contact?.email ?? "",
                      phone: state.contact?.phone ?? "",
                      company: state.contact?.company ?? "",
                    }}
                    reapplying={status === "declined"}
                  />
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-sm border border-border-gray bg-white p-6">
              <h2 className="font-heading text-lg uppercase tracking-wide text-dark-charcoal">
                What you get
              </h2>
              <ul className="mt-4 space-y-3 text-sm text-medium-gray">
                <li className="flex gap-3">
                  <BadgeCheck
                    className="mt-0.5 size-4 shrink-0 text-titan-yellow"
                    aria-hidden="true"
                  />
                  A personal code worth {state.discountPercent}% off for anyone
                  who uses it
                </li>
                <li className="flex gap-3">
                  <ShieldCheck
                    className="mt-0.5 size-4 shrink-0 text-titan-yellow"
                    aria-hidden="true"
                  />
                  Credit for every order placed with your code
                </li>
                <li className="flex gap-3">
                  <Megaphone
                    className="mt-0.5 size-4 shrink-0 text-titan-yellow"
                    aria-hidden="true"
                  />
                  Early access to promotions and new-arrival drops
                </li>
              </ul>
            </div>

            <div className="rounded-sm border border-border-gray bg-white p-6">
              <h2 className="font-heading text-lg uppercase tracking-wide text-dark-charcoal">
                Program rules
              </h2>
              <ul className="mt-4 space-y-2.5 text-sm text-medium-gray">
                {RULES.map((rule) => (
                  <li key={rule} className="flex gap-2">
                    <span aria-hidden="true">·</span>
                    {rule}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-medium-gray">
                Questions? Email{" "}
                <a
                  href={`mailto:${SITE_CONFIG.email}`}
                  className="font-medium text-dark-charcoal underline-offset-2 hover:underline"
                >
                  {SITE_CONFIG.email}
                </a>
                .
              </p>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
