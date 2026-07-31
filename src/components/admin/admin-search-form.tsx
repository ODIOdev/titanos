import { Input } from "@/components/ui/input";

type AdminSearchFormProps = {
  action?: string;
  placeholder: string;
  defaultValue?: string;
  hiddenFields?: Record<string, string>;
  label?: string;
};

export function AdminSearchForm({
  action,
  placeholder,
  defaultValue = "",
  hiddenFields,
  label = "Search",
}: AdminSearchFormProps) {
  const clearHref = (() => {
    if (!defaultValue) return null;
    const params = new URLSearchParams(hiddenFields ?? {});
    const qs = params.toString();
    const base = action ?? "";
    return qs ? `${base}?${qs}` : base || "?";
  })();

  return (
    <form
      className="flex flex-1 flex-wrap gap-2"
      method="get"
      action={action}
      role="search"
    >
      {hiddenFields
        ? Object.entries(hiddenFields).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))
        : null}
      <div className="min-w-[12rem] flex-1 sm:max-w-xs">
        <Input
          name="q"
          type="search"
          placeholder={placeholder}
          defaultValue={defaultValue}
          aria-label={label}
        />
      </div>
      <button
        type="submit"
        className="inline-flex h-10 shrink-0 items-center rounded-sm border border-border-gray bg-white px-3 text-sm font-semibold text-dark-charcoal hover:bg-light-gray"
      >
        Search
      </button>
      {clearHref ? (
        <a
          href={clearHref}
          className="inline-flex h-10 shrink-0 items-center rounded-sm px-2 text-sm font-medium text-medium-gray hover:text-dark-charcoal"
        >
          Clear
        </a>
      ) : null}
    </form>
  );
}
