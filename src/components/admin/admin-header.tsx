import type { ReactNode } from "react";

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
    <header className="flex flex-col gap-3 border-b border-border-gray bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {back ? <div className="mb-2">{back}</div> : null}
        <h1 className="font-heading text-2xl font-semibold uppercase tracking-wide text-dark-charcoal">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-medium-gray">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-3">{actions}</div>
      ) : null}
    </header>
  );
}
