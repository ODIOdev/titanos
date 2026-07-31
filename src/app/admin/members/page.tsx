import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminSearchForm } from "@/components/admin/admin-search-form";
import { DataTable } from "@/components/admin/data-table";
import { MemberRowActions } from "@/components/admin/member-row-actions";
import { PromoDiscountCard } from "@/components/admin/promo-discount-card";
import { Badge } from "@/components/ui/badge";
import { getAdminMembers, getPromoDiscountSettings } from "@/lib/data/admin";
import { formatDate, isMasterAdminEmail } from "@/lib/utils";

type SearchParams = Promise<{ q?: string }>;

function initialsOf(first: string | null, last: string | null) {
  return [first, last]
    .map((part) => part?.trim()?.[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = params.q ?? "";
  const [members, promoDiscounts] = await Promise.all([
    getAdminMembers({ q }),
    getPromoDiscountSettings(),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-sm text-medium-gray">
          Internal crew accounts with access to this dashboard.
        </p>
        <Link
          href="/admin/members/new"
          className="inline-flex items-center gap-2 rounded-sm bg-titan-yellow px-4 py-2 text-sm font-semibold uppercase tracking-wide text-near-black transition-colors hover:bg-titan-yellow/90"
        >
          <Plus className="size-4" aria-hidden="true" />
          Add member
        </Link>
      </div>
      <AdminSearchForm
        placeholder="Search name, email, role…"
        defaultValue={q}
        label="Search members"
      />
      <PromoDiscountCard settings={promoDiscounts} />
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
            <span key={`${m.id}-promo`} className="font-mono text-xs uppercase">
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
    </div>
  );
}
