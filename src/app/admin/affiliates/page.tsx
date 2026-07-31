import Link from "next/link";
import { AdminSearchForm } from "@/components/admin/admin-search-form";
import { AffiliateApplicationsCard } from "@/components/admin/affiliate-applications-card";
import { DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import {
  AFFILIATE_ELIGIBILITY_ORDERS,
  getAdminAffiliateApplications,
  getAdminAffiliates,
} from "@/lib/data/admin";
import { formatCurrency, isAdminRole } from "@/lib/utils";

type SearchParams = Promise<{ q?: string }>;

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
    <div className="rounded-sm border border-border-gray bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-medium-gray">
        {label}
      </p>
      <p className="mt-1 font-heading text-2xl font-semibold tabular-nums leading-none text-dark-charcoal">
        {value}
      </p>
      <p className="mt-1 text-xs text-medium-gray">{hint}</p>
    </div>
  );
}

export default async function AdminAffiliatesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = params.q ?? "";
  const [
    { affiliates, totalCount, eligibleCount, totalUses, activeCount },
    applications,
  ] = await Promise.all([
    getAdminAffiliates({ q }),
    getAdminAffiliateApplications(),
  ]);
  const pendingCount = applications.filter((a) => a.status === "pending").length;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatTile
          label="Affiliates"
          value={String(totalCount)}
          hint="Profiles with a promo code"
        />
        <StatTile
          label="Applications"
          value={String(pendingCount)}
          hint="Waiting on your review"
        />
        <StatTile
          label="Eligible to share"
          value={String(eligibleCount)}
          hint={`Customers need ${AFFILIATE_ELIGIBILITY_ORDERS} orders`}
        />
        <StatTile
          label="Code redemptions"
          value={String(totalUses)}
          hint="Orders placed with a promo code"
        />
        <StatTile
          label="Active codes"
          value={String(activeCount)}
          hint={`${totalCount - activeCount} disabled`}
        />
      </div>

      <AffiliateApplicationsCard applications={applications} />

      <AdminSearchForm
        placeholder="Search code, name, email, company…"
        defaultValue={q}
        label="Search affiliates"
      />

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
                {a.orders_count} of {AFFILIATE_ELIGIBILITY_ORDERS}
              </Badge>
            ),
          ];
        })}
      />
    </div>
  );
}
