import Image from "next/image";
import Link from "next/link";
import {
  BadgePercent,
  Plus,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import { AdminSearchForm } from "@/components/admin/admin-search-form";
import { AffiliateApplicationsCard } from "@/components/admin/affiliate-applications-card";
import { DataTable } from "@/components/admin/data-table";
import { MemberRowActions } from "@/components/admin/member-row-actions";
import { PromoDiscountCard } from "@/components/admin/promo-discount-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  AFFILIATE_ELIGIBILITY_ORDERS,
  getAdminAffiliateApplications,
  getAdminAffiliates,
  getAdminCustomers,
  getAdminMembers,
  getPromoDiscountSettings,
} from "@/lib/data/admin";
import {
  cn,
  formatCurrency,
  formatDate,
  isAdminRole,
  isMasterAdminEmail,
} from "@/lib/utils";

type TabId = "customers" | "members" | "affiliates";
type SearchParams = Promise<{ tab?: string; q?: string }>;

function parseTab(value: string | undefined): TabId {
  if (value === "members" || value === "affiliates") return value;
  return "customers";
}

function tabHref(tab: TabId, q?: string) {
  const params = new URLSearchParams();
  if (tab !== "customers") params.set("tab", tab);
  if (q?.trim()) params.set("q", q.trim());
  const qs = params.toString();
  return qs ? `/admin/users?${qs}` : "/admin/users";
}

function initialsOf(first: string | null, last: string | null) {
  return [first, last]
    .map((part) => part?.trim()?.[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const tab = parseTab(params.tab);
  const q = params.q ?? "";

  const [customers, members, affiliateSummary, applications, promoDiscounts] =
    await Promise.all([
      getAdminCustomers({ q: tab === "customers" ? q : undefined }),
      getAdminMembers({ q: tab === "members" ? q : undefined }),
      getAdminAffiliates({ q: tab === "affiliates" ? q : undefined }),
      getAdminAffiliateApplications(),
      getPromoDiscountSettings(),
    ]);

  const {
    affiliates,
    totalCount: affiliateTotal,
    eligibleCount,
    totalUses,
    activeCount,
  } = affiliateSummary;

  const pendingApps = applications.filter((a) => a.status === "pending").length;
  const customerOrders = customers.reduce((sum, c) => sum + c.orders_count, 0);
  const customerSpent = customers.reduce((sum, c) => sum + c.total_spent, 0);
  const ownerCount = members.filter((m) => m.is_owner).length;
  const totalPeople = customers.length + members.length;

  return (
    <div className="space-y-5 @5xl:space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-medium-gray">
            People directory
          </p>
          <p className="mt-1 text-sm text-medium-gray">
            Customers, team access, and affiliate partners — one place to manage
            who buys, who runs the shop, and who shares promo codes.
          </p>
        </div>
        {tab === "members" ? (
          <Link
            href="/admin/members/new"
            className={cn(
              buttonVariants({ variant: "primary", size: "sm" }),
              "gap-1.5",
            )}
          >
            <Plus className="size-3.5" aria-hidden="true" />
            Add member
          </Link>
        ) : null}
      </div>

      <nav
        className="grid grid-cols-1 gap-1.5 @5xl:grid-cols-4 @5xl:gap-3"
        aria-label="User segments"
      >
        <UsersHeroCard
          totalPeople={totalPeople}
          customers={customers.length}
          members={members.length}
          affiliates={affiliateTotal}
        />
        <SegmentCard
          href={tabHref("customers")}
          label="Customers"
          value={String(customers.length)}
          hint={`${customerOrders} orders · ${formatCurrency(customerSpent)}`}
          icon={Users}
          active={tab === "customers"}
          accent="bg-emerald-100 text-emerald-800"
          barClass="bg-emerald-400"
          spark={[
            { label: "Orders", value: String(customerOrders) },
            { label: "Spent", value: formatCurrency(customerSpent) },
          ]}
        />
        <SegmentCard
          href={tabHref("members")}
          label="Team"
          value={String(members.length)}
          hint="Dashboard access accounts"
          icon={UserCog}
          active={tab === "members"}
          accent="bg-sky-100 text-sky-800"
          barClass="bg-sky-400"
          spark={[
            { label: "Owners", value: String(ownerCount) },
            {
              label: "Admins",
              value: String(Math.max(0, members.length - ownerCount)),
            },
          ]}
        />
        <SegmentCard
          href={tabHref("affiliates")}
          label="Affiliates"
          value={String(affiliateTotal)}
          hint={
            pendingApps > 0
              ? `${pendingApps} application${pendingApps === 1 ? "" : "s"} pending`
              : `${eligibleCount} eligible to share`
          }
          icon={BadgePercent}
          active={tab === "affiliates"}
          accent={
            pendingApps > 0
              ? "bg-orange-100 text-orange-800"
              : "bg-amber-100 text-amber-900"
          }
          barClass={pendingApps > 0 ? "bg-orange-400" : "bg-amber-400"}
          spark={[
            { label: "Active", value: String(activeCount) },
            { label: "Redeemed", value: String(totalUses) },
          ]}
        />
      </nav>

      <section className="overflow-hidden rounded-sm border border-border-gray bg-white">
        <div className="flex flex-col gap-3 border-b border-border-gray px-4 py-3 @5xl:flex-row @5xl:items-center @5xl:justify-between @5xl:px-5">
          <div className="min-w-0">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal">
              {tab === "customers"
                ? "Customers"
                : tab === "members"
                  ? "Team members"
                  : "Affiliate partners"}
            </h2>
            <p className="text-xs text-medium-gray">
              {tab === "customers"
                ? "Shop buyers and wholesale accounts"
                : tab === "members"
                  ? "Internal crew with admin dashboard access"
                  : "Promo codes, eligibility, and applications"}
            </p>
          </div>
          <AdminSearchForm
            action="/admin/users"
            placeholder={
              tab === "customers"
                ? "Search name, email, company…"
                : tab === "members"
                  ? "Search name, email, role…"
                  : "Search code, name, email…"
            }
            defaultValue={q}
            label={`Search ${tab}`}
            hiddenFields={tab === "customers" ? undefined : { tab }}
          />
        </div>

        <div className="space-y-4 p-4 @5xl:p-5">
          {tab === "customers" ? (
            <CustomersPanel customers={customers} q={q} />
          ) : null}
          {tab === "members" ? (
            <MembersPanel members={members} q={q} />
          ) : null}
          {tab === "affiliates" ? (
            <AffiliatesPanel
              affiliates={affiliates}
              applications={applications}
              promoDiscounts={promoDiscounts}
              q={q}
              eligibilityOrders={AFFILIATE_ELIGIBILITY_ORDERS}
            />
          ) : null}
        </div>
      </section>
    </div>
  );
}

function UsersHeroCard({
  totalPeople,
  customers,
  members,
  affiliates,
}: {
  totalPeople: number;
  customers: number;
  members: number;
  affiliates: number;
}) {
  return (
    <div className="relative min-w-0 overflow-hidden rounded-sm border-2 border-titan-yellow bg-dark-charcoal px-3 py-2 text-white shadow-[0_8px_24px_rgba(16,24,32,0.18)] @5xl:p-4">
      <div
        className="pointer-events-none absolute -right-6 -top-8 size-28 rounded-full bg-titan-yellow/20 blur-2xl"
        aria-hidden="true"
      />
      <div className="relative @5xl:hidden">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-sm bg-titan-yellow text-dark-charcoal">
            <Users className="size-3.5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-titan-yellow">
              Users
            </p>
            <p className="mt-0.5 line-clamp-1 text-[0.65rem] text-white/65">
              {customers} buyers · {members} team · {affiliates} affiliates
            </p>
          </div>
          <p className="shrink-0 font-heading text-xl font-bold tabular-nums text-titan-yellow">
            {totalPeople}
          </p>
        </div>
      </div>
      <div className="relative hidden @5xl:block">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-titan-yellow">
              Users
            </p>
            <p className="mt-2 font-heading text-4xl font-bold tabular-nums tracking-tight text-white">
              {totalPeople}
            </p>
            <p className="mt-1 text-xs text-white/65">
              People across the platform
            </p>
          </div>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-titan-yellow text-dark-charcoal">
            <Users className="size-5" aria-hidden="true" />
          </span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { label: "Buyers", value: customers },
            { label: "Team", value: members },
            { label: "Codes", value: affiliates },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-sm border border-white/10 bg-white/5 px-2 py-1.5"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-white/55">
                {item.label}
              </p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums text-white">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SegmentCard({
  href,
  label,
  value,
  hint,
  icon: Icon,
  active,
  accent,
  barClass,
  spark,
}: {
  href: string;
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  active: boolean;
  accent: string;
  barClass: string;
  spark: { label: string; value: string }[];
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative min-w-0 overflow-hidden rounded-sm border bg-white px-3 py-2 transition-colors @5xl:p-4",
        active
          ? "border-titan-yellow ring-1 ring-titan-yellow"
          : "border-border-gray hover:border-dark-charcoal/30",
      )}
      aria-current={active ? "page" : undefined}
    >
      <div className="@5xl:hidden">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-sm",
              accent,
            )}
          >
            <Icon className="size-3.5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.65rem] font-semibold uppercase tracking-wide text-medium-gray">
              {label}
            </p>
            <p className="mt-0.5 line-clamp-1 text-[0.65rem] text-medium-gray">
              {hint}
            </p>
          </div>
          <p className="shrink-0 font-heading text-xl font-semibold tabular-nums leading-none text-dark-charcoal">
            {value}
          </p>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-light-gray">
          <div
            className={cn("h-full rounded-full", barClass)}
            style={{ width: active ? "100%" : "42%" }}
            aria-hidden="true"
          />
        </div>
      </div>

      <div className="hidden @5xl:block">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-wide text-medium-gray">
              {label}
            </p>
            <p className="mt-1.5 font-heading text-3xl font-semibold tabular-nums text-dark-charcoal">
              {value}
            </p>
            <p className="mt-1 text-xs text-medium-gray">{hint}</p>
          </div>
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-sm",
              accent,
            )}
          >
            <Icon className="size-5" aria-hidden="true" />
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {spark.map((item) => (
            <div
              key={item.label}
              className="rounded-sm bg-light-gray/70 px-2 py-1.5"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-medium-gray">
                {item.label}
              </p>
              <p className="mt-0.5 truncate text-sm font-semibold tabular-nums text-dark-charcoal">
                {item.value}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-light-gray">
          <div
            className={cn("h-full rounded-full", barClass)}
            style={{ width: active ? "100%" : "42%" }}
          />
        </div>
      </div>
    </Link>
  );
}

function CustomersPanel({
  customers,
  q,
}: {
  customers: Awaited<ReturnType<typeof getAdminCustomers>>;
  q: string;
}) {
  const totalOrders = customers.reduce((sum, c) => sum + c.orders_count, 0);
  const grandTotalSpent = customers.reduce((sum, c) => sum + c.total_spent, 0);

  return (
    <DataTable
      columns={[
        { key: "name", header: "Name" },
        { key: "email", header: "Email" },
        { key: "company", header: "Company" },
        { key: "promo", header: "Promo code" },
        { key: "orders", header: "Orders" },
        { key: "spent", header: "Total spent" },
        { key: "joined", header: "Joined" },
      ]}
      emptyMessage={
        q.trim() ? `No customers match “${q.trim()}”.` : "No customers yet."
      }
      rows={customers.map((c) => {
        const name =
          [c.first_name, c.last_name].filter(Boolean).join(" ") || "—";
        return [
          <Link
            key={`${c.id}-name`}
            href={`/admin/customers/${c.id}`}
            className="font-medium text-dark-charcoal underline-offset-2 hover:underline"
          >
            {name}
          </Link>,
          <Link
            key={`${c.id}-email`}
            href={`/admin/customers/${c.id}`}
            className="text-dark-charcoal underline-offset-2 hover:underline"
          >
            {c.email}
          </Link>,
          <span key={`${c.id}-co`}>{c.company ?? "—"}</span>,
          <span key={`${c.id}-promo`} className="font-mono text-xs">
            {c.promo_code ?? "—"}
          </span>,
          <span key={`${c.id}-orders`} className="tabular-nums">
            {c.orders_count}
          </span>,
          <span key={`${c.id}-spent`} className="font-semibold tabular-nums">
            {formatCurrency(c.total_spent)}
          </span>,
          <span key={`${c.id}-joined`}>{formatDate(c.created_at)}</span>,
        ];
      })}
      footer={
        customers.length > 0
          ? [
              <span key="ft-label" className="uppercase tracking-wide">
                Grand total
              </span>,
              <span key="ft-email" className="text-medium-gray">
                {customers.length} customer
                {customers.length === 1 ? "" : "s"}
              </span>,
              <span key="ft-co" />,
              <span key="ft-promo" />,
              <span key="ft-orders" className="tabular-nums">
                {totalOrders}
              </span>,
              <span key="ft-spent" className="tabular-nums">
                {formatCurrency(grandTotalSpent)}
              </span>,
              <span key="ft-joined" />,
            ]
          : null
      }
    />
  );
}

function MembersPanel({
  members,
  q,
}: {
  members: Awaited<ReturnType<typeof getAdminMembers>>;
  q: string;
}) {
  return (
    <DataTable
      columns={[
        { key: "member", header: "Member" },
        { key: "email", header: "Email" },
        { key: "phone", header: "Phone" },
        { key: "promo", header: "Promo code" },
        { key: "access", header: "Access" },
        { key: "joined", header: "Joined" },
        { key: "actions", header: "Actions", className: "text-right" },
      ]}
      emptyMessage={
        q.trim() ? `No members match “${q.trim()}”.` : "No members found."
      }
      rows={members.map((m) => {
        const name =
          [m.first_name, m.last_name].filter(Boolean).join(" ") || m.email;
        const isMaster = isMasterAdminEmail(m.email);

        return [
          <Link
            key={`${m.id}-member`}
            href={`/admin/members/${m.id}`}
            className="flex items-center gap-3 text-dark-charcoal"
          >
            <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-gray bg-light-gray">
              {m.avatar_url ? (
                <Image
                  src={m.avatar_url}
                  alt=""
                  fill
                  unoptimized
                  sizes="36px"
                  className="object-cover"
                />
              ) : (
                <span className="font-heading text-xs font-semibold uppercase">
                  {initialsOf(m.first_name, m.last_name) || "?"}
                </span>
              )}
            </span>
            <span className="font-medium underline-offset-2 hover:underline">
              {name}
            </span>
          </Link>,
          <span key={`${m.id}-email`}>{m.email}</span>,
          <span key={`${m.id}-phone`}>{m.phone || "—"}</span>,
          <span
            key={`${m.id}-promo`}
            className="font-mono text-xs uppercase"
          >
            {m.promo_code || "—"}
          </span>,
          <Badge
            key={`${m.id}-access`}
            variant={m.is_owner ? "success" : "default"}
          >
            {m.is_owner ? "Owner" : "Admin"}
          </Badge>,
          <span key={`${m.id}-joined`}>{formatDate(m.created_at)}</span>,
          <MemberRowActions
            key={`${m.id}-actions`}
            memberId={m.id}
            memberName={name}
            canDelete={!isMaster}
          />,
        ];
      })}
    />
  );
}

function AffiliatesPanel({
  affiliates,
  applications,
  promoDiscounts,
  q,
  eligibilityOrders,
}: {
  affiliates: Awaited<ReturnType<typeof getAdminAffiliates>>["affiliates"];
  applications: Awaited<ReturnType<typeof getAdminAffiliateApplications>>;
  promoDiscounts: Awaited<ReturnType<typeof getPromoDiscountSettings>>;
  q: string;
  eligibilityOrders: number;
}) {
  return (
    <div className="space-y-4">
      <PromoDiscountCard settings={promoDiscounts} />
      <AffiliateApplicationsCard applications={applications} />
      <DataTable
        columns={[
          { key: "name", header: "Affiliate" },
          { key: "code", header: "Promo code" },
          { key: "discount", header: "Discount" },
          { key: "role", header: "Type" },
          { key: "uses", header: "Redemptions" },
          { key: "orders", header: "Orders" },
          { key: "spent", header: "Total spent" },
          { key: "status", header: "Status" },
        ]}
        emptyMessage={
          q.trim()
            ? `No affiliates match “${q.trim()}”.`
            : "No affiliate promo codes yet."
        }
        rows={affiliates.map((a) => {
          const name =
            [a.first_name, a.last_name].filter(Boolean).join(" ") || a.email;
          const admin = a.is_owner || isAdminRole(a.role);
          const detailHref = admin
            ? `/admin/members/${a.id}`
            : `/admin/customers/${a.id}`;
          return [
            <div key={`${a.id}-name`} className="min-w-0">
              <Link
                href={detailHref}
                className="font-medium text-dark-charcoal underline-offset-2 hover:underline"
              >
                {name}
              </Link>
              <p className="truncate text-xs text-medium-gray">{a.email}</p>
            </div>,
            <span key={`${a.id}-code`} className="font-mono text-xs">
              {a.promo_code}
            </span>,
            <span key={`${a.id}-discount`} className="tabular-nums">
              {a.discount_percent}%
            </span>,
            <span key={`${a.id}-role`} className="text-medium-gray">
              {admin ? "Team" : "Customer"}
            </span>,
            <span key={`${a.id}-uses`} className="tabular-nums">
              {a.uses}
            </span>,
            <span key={`${a.id}-orders`} className="tabular-nums">
              {a.orders_count}
            </span>,
            <span key={`${a.id}-spent`} className="tabular-nums">
              {formatCurrency(a.total_spent)}
            </span>,
            !a.code_active ? (
              <Badge key={`${a.id}-status`} variant="default">
                Disabled
              </Badge>
            ) : a.eligible ? (
              <Badge key={`${a.id}-status`} variant="success">
                Sharing
              </Badge>
            ) : (
              <Badge key={`${a.id}-status`} variant="warning">
                {a.orders_count} of {eligibilityOrders}
              </Badge>
            ),
          ];
        })}
      />
    </div>
  );
}
