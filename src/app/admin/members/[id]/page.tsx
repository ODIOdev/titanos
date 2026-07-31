import Image from "next/image";
import { notFound } from "next/navigation";
import { MemberDetailActions } from "@/components/admin/member-detail-actions";
import { Badge } from "@/components/ui/badge";
import { getAdminMember } from "@/lib/data/admin";
import { formatDate, isMasterAdminEmail } from "@/lib/utils";

type Params = Promise<{ id: string }>;

/** Date-only values have no timezone, so avoid Date parsing shifting the day. */
function formatDateOnly(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return formatDate(new Date(year, month - 1, day));
}

export default async function AdminMemberDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const member = await getAdminMember(id);
  if (!member) notFound();

  const displayName =
    [member.first_name, member.last_name].filter(Boolean).join(" ") ||
    member.email;

  const initials = [member.first_name, member.last_name]
    .map((part) => part?.trim()?.[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-heading text-xl font-semibold uppercase tracking-wide">
            {displayName}
          </h2>
          <Badge variant={member.is_owner ? "success" : "default"}>
            {member.is_owner ? "Owner" : "Admin"}
          </Badge>
        </div>
        <MemberDetailActions
          memberId={member.id}
          memberName={displayName}
          canDelete={!isMasterAdminEmail(member.email)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-sm border border-border-gray bg-white p-5 lg:col-span-1">
          <div className="flex items-center gap-4">
            <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-gray bg-light-gray">
              {member.avatar_url ? (
                <Image
                  src={member.avatar_url}
                  alt=""
                  fill
                  unoptimized
                  sizes="64px"
                  className="object-cover"
                />
              ) : (
                <span className="font-heading text-lg font-semibold uppercase text-dark-charcoal">
                  {initials || "?"}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-heading text-lg font-semibold uppercase tracking-wide text-dark-charcoal">
                {displayName}
              </p>
              <p className="truncate text-sm text-medium-gray">
                {member.email}
              </p>
            </div>
          </div>

          <dl className="mt-5 space-y-3 text-sm">
            <div>
              <dt className="text-medium-gray">Phone</dt>
              <dd>{member.phone || "—"}</dd>
            </div>
            <div>
              <dt className="text-medium-gray">Date of birth</dt>
              <dd>
                {member.date_of_birth
                  ? formatDateOnly(member.date_of_birth)
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-medium-gray">Role</dt>
              <dd className="capitalize">{member.role}</dd>
            </div>
            <div>
              <dt className="text-medium-gray">Added</dt>
              <dd>{formatDate(member.created_at)}</dd>
            </div>
          </dl>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-sm border border-border-gray bg-white p-5">
            <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal">
              Login
            </h3>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="text-medium-gray">Email</dt>
                <dd className="font-medium">{member.email}</dd>
              </div>
              <div>
                <dt className="text-medium-gray">Password</dt>
                <dd className="font-mono tracking-widest">••••••••</dd>
                <p className="mt-1 text-xs text-medium-gray">
                  Current password cannot be shown (encrypted). Open the key
                  icon → set a new password → it will display for you to copy.
                </p>
              </div>
            </dl>
          </div>

          <div className="rounded-sm border border-border-gray bg-white p-5">
            <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal">
              Promo code
            </h3>
            <p className="mt-3 font-mono text-xl font-semibold uppercase tracking-wide text-dark-charcoal">
              {member.promo_code ?? "—"}
            </p>
            <p className="mt-3 text-xs text-medium-gray">
              Shareable discount code tied to this team member.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
