import type { ReactNode } from "react";
import { AdminGlobalSearch } from "@/components/admin/admin-global-search";

type AdminHeaderProps = {
  title: string;
  description?: string;
  back?: ReactNode;
  actions?: ReactNode;
};

export function AdminHeader({
  title,
  description,
  back,
  actions,
}: AdminHeaderProps) {
  return (
    <header className="flex flex-col gap-3 border-b border-border-gray bg-white px-4 py-3 @5xl:flex-row @5xl:items-center @5xl:justify-between @5xl:px-6 @5xl:py-4">
      <div className="min-w-0">
        {back ? <div className="mb-2">{back}</div> : null}
        <h1 className="font-heading text-xl font-semibold uppercase tracking-wide text-dark-charcoal @5xl:text-2xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 hidden text-sm text-medium-gray @5xl:block">
            {description}
          </p>
        ) : null}
      </div>
      <div className="flex w-full min-w-0 flex-col gap-3 @5xl:w-auto @5xl:flex-row @5xl:items-center @5xl:justify-end">
        <AdminGlobalSearch />
        {actions ? (
          <div className="flex flex-wrap items-center gap-3">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}
