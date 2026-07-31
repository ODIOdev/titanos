"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Clock, Inbox, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { reviewAffiliateApplication } from "@/lib/actions/admin";
import { AFFILIATE_ELIGIBILITY_ORDERS } from "@/lib/affiliates/program";
import type { AdminAffiliateApplication } from "@/lib/data/admin";
import { cn, formatDate } from "@/lib/utils";

function StatusBadge({ status }: { status: AdminAffiliateApplication["status"] }) {
  if (status === "approved") return <Badge variant="success">Approved</Badge>;
  if (status === "declined") return <Badge variant="default">Declined</Badge>;
  return <Badge variant="warning">Pending</Badge>;
}

function ApplicationRow({
  application,
  onDecline,
}: {
  application: AdminAffiliateApplication;
  onDecline: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const decided = application.status !== "pending";

  function approve() {
    startTransition(async () => {
      const result = await reviewAffiliateApplication({
        applicationId: application.id,
        decision: "approved",
      });
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <li className="flex flex-col gap-3 px-4 py-4 sm:px-5 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/admin/customers/${application.user_id}`}
            className="font-medium text-dark-charcoal underline-offset-2 hover:underline"
          >
            {application.contact_name}
          </Link>
          <StatusBadge status={application.status} />
          {application.promo_code ? (
            <span className="font-mono text-xs text-medium-gray">
              {application.promo_code}
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 truncate text-xs text-medium-gray">
          {application.email}
          {application.company ? ` · ${application.company}` : ""}
          {application.phone ? ` · ${application.phone}` : ""}
        </p>
        <p className="mt-2 text-sm text-dark-charcoal">{application.audience}</p>
        {application.motivation ? (
          <p className="mt-1 text-sm text-medium-gray">
            {application.motivation}
          </p>
        ) : null}
        {application.admin_note ? (
          <p className="mt-2 text-xs text-medium-gray">
            <span className="font-semibold text-dark-charcoal">Note: </span>
            {application.admin_note}
          </p>
        ) : null}
        <p className="mt-2 text-xs text-medium-gray">
          Applied {formatDate(application.created_at)}
          {decided && application.reviewed_at
            ? ` · reviewed ${formatDate(application.reviewed_at)}`
            : ""}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3 lg:flex-col lg:items-end">
        <p
          className={cn(
            "text-xs font-semibold uppercase tracking-wide",
            application.eligible ? "text-success-green" : "text-warning-orange",
          )}
        >
          {application.orders_count} / {AFFILIATE_ELIGIBILITY_ORDERS} orders
        </p>
        {decided ? null : (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="primary"
              disabled={pending || !application.eligible}
              title={
                application.eligible
                  ? undefined
                  : `Needs ${AFFILIATE_ELIGIBILITY_ORDERS - application.orders_count} more orders`
              }
              onClick={approve}
            >
              <Check className="mr-1 size-4" aria-hidden="true" />
              Approve
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={onDecline}
            >
              <X className="mr-1 size-4" aria-hidden="true" />
              Decline
            </Button>
          </div>
        )}
      </div>
    </li>
  );
}

export function AffiliateApplicationsCard({
  applications,
}: {
  applications: AdminAffiliateApplication[];
}) {
  const router = useRouter();
  const [declining, setDeclining] = useState<AdminAffiliateApplication | null>(
    null,
  );
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  const waiting = applications.filter((a) => a.status === "pending");
  const readyCount = waiting.filter((a) => a.eligible).length;

  function confirmDecline() {
    if (!declining) return;
    startTransition(async () => {
      const result = await reviewAffiliateApplication({
        applicationId: declining.id,
        decision: "declined",
        note,
      });
      if (result.success) {
        toast.success(result.message);
        setDeclining(null);
        setNote("");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <section className="overflow-hidden rounded-sm border border-border-gray bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-gray px-4 py-4 sm:px-5">
        <div>
          <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal">
            Applications
          </h2>
          <p className="mt-0.5 text-xs text-medium-gray">
            Approve unlocks after {AFFILIATE_ELIGIBILITY_ORDERS} completed
            orders.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={waiting.length ? "warning" : "default"}>
            <Clock className="mr-1 inline size-3" aria-hidden="true" />
            {waiting.length} pending
          </Badge>
          <Badge variant={readyCount ? "success" : "default"}>
            {readyCount} ready to approve
          </Badge>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
          <Inbox className="size-6 text-medium-gray" aria-hidden="true" />
          <p className="text-sm text-medium-gray">
            No affiliate applications yet. Customers apply from the storefront
            affiliates page.
          </p>
          <Link
            href="/affiliates"
            className="text-sm font-medium text-dark-charcoal underline-offset-2 hover:underline"
          >
            View the program page
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-border-gray">
          {applications.map((application) => (
            <ApplicationRow
              key={application.id}
              application={application}
              onDecline={() => {
                setDeclining(application);
                setNote("");
              }}
            />
          ))}
        </ul>
      )}

      <Dialog
        open={Boolean(declining)}
        onOpenChange={(open) => {
          if (!open) setDeclining(null);
        }}
        title="Decline application"
        description={
          declining
            ? `${declining.contact_name} will see your note and can re-apply.`
            : undefined
        }
      >
        <Textarea
          label="Note to applicant"
          rows={3}
          hint="Optional."
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setDeclining(null)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={confirmDecline}
            disabled={pending}
          >
            {pending ? "Declining…" : "Decline application"}
          </Button>
        </div>
      </Dialog>
    </section>
  );
}
