"use client";

import {
  useId,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  ChevronDown,
  Clock3,
  MessageCircle,
  Radio,
} from "lucide-react";
import { toast } from "sonner";
import { saveSupportChatSettings } from "@/lib/actions/admin";
import type {
  SupportChatPresence,
  SupportChatSettings,
  SupportDayKey,
  SupportSchedule,
} from "@/lib/data/support-chat-settings-shared";
import {
  formatSupportHoursLabel,
  SUPPORT_CLOSE_HOUR_OPTIONS,
  SUPPORT_DAY_LABELS,
  SUPPORT_DAY_ORDER,
  SUPPORT_HOUR_OPTIONS,
} from "@/lib/support/hours";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const PRESENCE_OPTIONS: {
  label: string;
  value: SupportChatPresence;
  hint: string;
}[] = [
  { label: "Auto", value: "auto", hint: "Follow hours" },
  { label: "Online", value: "online", hint: "Always on" },
  { label: "Offline", value: "offline", hint: "Always off" },
];

function schedulesEqual(a: SupportSchedule, b: SupportSchedule) {
  return SUPPORT_DAY_ORDER.every(
    (day) =>
      a[day].enabled === b[day].enabled &&
      a[day].openHour === b[day].openHour &&
      a[day].closeHour === b[day].closeHour,
  );
}

function ToggleRow({
  checked,
  onCheckedChange,
  title,
  description,
  icon,
}: {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  title: ReactNode;
  description: string;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "flex w-full items-start gap-3 rounded-sm border px-3 py-3 text-left transition-colors",
        checked
          ? "border-dark-charcoal/20 bg-white"
          : "border-border-gray bg-light-gray/40",
      )}
    >
      {icon ? (
        <span
          className={cn(
            "mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-sm",
            checked
              ? "bg-titan-yellow text-near-black"
              : "bg-light-gray text-medium-gray",
          )}
        >
          {icon}
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-dark-charcoal">
          {title}
        </span>
        <span className="mt-0.5 block text-xs text-medium-gray">
          {description}
        </span>
      </span>
      <span
        className={cn(
          "relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors",
          checked ? "bg-dark-charcoal" : "bg-border-gray",
        )}
        aria-hidden="true"
      >
        <span
          className={cn(
            "absolute top-0.5 size-4 rounded-full bg-white transition-transform",
            checked ? "translate-x-4" : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  );
}

export function SupportChatSettingsCard({
  settings,
}: {
  settings: SupportChatSettings;
}) {
  const router = useRouter();
  const panelId = useId();
  const hoursPanelId = useId();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [hoursOpen, setHoursOpen] = useState(false);
  const [widgetEnabled, setWidgetEnabled] = useState(settings.widgetEnabled);
  const [aiEnabled, setAiEnabled] = useState(settings.aiEnabled);
  const [presence, setPresence] = useState<SupportChatPresence>(settings.presence);
  const [schedule, setSchedule] = useState<SupportSchedule>(settings.schedule);
  const [greeting, setGreeting] = useState(settings.greeting);

  const hoursPreview = useMemo(
    () => formatSupportHoursLabel(schedule),
    [schedule],
  );

  const dirty =
    widgetEnabled !== settings.widgetEnabled ||
    aiEnabled !== settings.aiEnabled ||
    presence !== settings.presence ||
    !schedulesEqual(schedule, settings.schedule) ||
    greeting.trim() !== settings.greeting;

  const presenceLabel =
    PRESENCE_OPTIONS.find((option) => option.value === presence)?.label ??
    "Auto";

  function updateDay(
    day: SupportDayKey,
    patch: Partial<SupportSchedule[SupportDayKey]>,
  ) {
    setSchedule((prev) => {
      const current = prev[day];
      let openHour = patch.openHour ?? current.openHour;
      let closeHour = patch.closeHour ?? current.closeHour;
      if (closeHour <= openHour) closeHour = Math.min(24, openHour + 1);
      return {
        ...prev,
        [day]: {
          enabled: patch.enabled ?? current.enabled,
          openHour,
          closeHour,
        },
      };
    });
  }

  function handleSave() {
    startTransition(async () => {
      const result = await saveSupportChatSettings({
        widgetEnabled,
        aiEnabled,
        presence,
        schedule,
        hoursLabel: hoursPreview,
        greeting,
      });
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  }

  return (
    <section className="overflow-hidden rounded-sm border border-border-gray bg-white">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex w-full items-start justify-between gap-3 bg-light-gray/40 px-5 py-4 text-left transition-colors hover:bg-light-gray/70",
          open && "border-b border-border-gray",
        )}
      >
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-sm bg-titan-yellow text-near-black">
            <MessageCircle className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-heading text-base font-semibold uppercase tracking-wide text-dark-charcoal">
                Support chat
              </h2>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-xs font-semibold uppercase tracking-wide",
                  widgetEnabled
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-light-gray text-medium-gray",
                )}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    widgetEnabled ? "bg-emerald-600" : "bg-medium-gray",
                  )}
                  aria-hidden="true"
                />
                {widgetEnabled ? "Visible" : "Hidden"}
              </span>
              {aiEnabled ? (
                <span className="inline-flex items-center gap-1 rounded-sm bg-dark-charcoal px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                  <Bot className="size-3" aria-hidden="true" />
                  AI
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-sm text-medium-gray">
              {open
                ? "Widget visibility, online status, weekly hours, and greeting."
                : `${presenceLabel} · ${hoursPreview}`}
            </p>
          </div>
        </div>
        <ChevronDown
          className={cn(
            "mt-1 ml-auto size-4 shrink-0 text-medium-gray transition-transform",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>

      <div id={panelId} hidden={!open} className="space-y-5 p-5">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-medium-gray">
            Widget
          </p>
          <ToggleRow
            checked={widgetEnabled}
            onCheckedChange={setWidgetEnabled}
            icon={<MessageCircle className="size-3.5" aria-hidden="true" />}
            title="Show store chat"
            description="Floating launcher on the website and account pages."
          />
          <ToggleRow
            checked={aiEnabled}
            onCheckedChange={setAiEnabled}
            icon={<Bot className="size-3.5" aria-hidden="true" />}
            title="AI-assisted replies"
            description="When off, visitors get basic topic help only."
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Radio className="size-3.5 text-dark-charcoal" aria-hidden="true" />
            <p className="text-xs font-semibold uppercase tracking-wide text-medium-gray">
              Online status
            </p>
          </div>
          <div
            role="radiogroup"
            aria-label="Online status"
            className="grid grid-cols-3 gap-2"
          >
            {PRESENCE_OPTIONS.map((option) => {
              const selected = presence === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setPresence(option.value)}
                  className={cn(
                    "rounded-sm border px-2 py-2.5 text-center transition-colors",
                    selected
                      ? "border-dark-charcoal bg-dark-charcoal text-white"
                      : "border-border-gray bg-white text-dark-charcoal hover:border-dark-charcoal/40",
                  )}
                >
                  <span className="block text-sm font-semibold">
                    {option.label}
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 block text-[11px]",
                      selected ? "text-white/70" : "text-medium-gray",
                    )}
                  >
                    {option.hint}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-hidden rounded-sm border border-border-gray">
          <button
            type="button"
            aria-expanded={hoursOpen}
            aria-controls={hoursPanelId}
            onClick={() => setHoursOpen((value) => !value)}
            className={cn(
              "flex w-full items-start justify-between gap-3 bg-light-gray/35 px-3 py-3 text-left transition-colors hover:bg-light-gray/60",
              hoursOpen && "border-b border-border-gray",
            )}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Clock3
                  className="size-3.5 text-dark-charcoal"
                  aria-hidden="true"
                />
                <p className="text-xs font-semibold uppercase tracking-wide text-medium-gray">
                  Support hours · CT
                </p>
              </div>
              <p className="mt-1 text-xs font-medium text-dark-charcoal">
                {hoursPreview}
              </p>
              {!hoursOpen ? (
                <p className="mt-0.5 text-[11px] text-medium-gray">
                  Expand to edit weekly open times
                </p>
              ) : null}
            </div>
            <ChevronDown
              className={cn(
                "mt-0.5 size-4 shrink-0 text-medium-gray transition-transform",
                hoursOpen && "rotate-180",
              )}
              aria-hidden="true"
            />
          </button>

          <div id={hoursPanelId} hidden={!hoursOpen} className="space-y-2 p-3">
            <p className="text-xs text-medium-gray">
              Used when status is Auto. Force Online/Offline ignores this
              schedule.
            </p>
            <ul className="overflow-hidden rounded-sm border border-border-gray">
              {SUPPORT_DAY_ORDER.map((day) => {
                const row = schedule[day];
                return (
                  <li
                    key={day}
                    className={cn(
                      "grid gap-2 border-b border-border-gray px-3 py-2 last:border-b-0 sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:items-center",
                      row.enabled ? "bg-white" : "bg-light-gray/45",
                    )}
                  >
                    <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-dark-charcoal">
                      <input
                        type="checkbox"
                        checked={row.enabled}
                        onChange={(event) =>
                          updateDay(day, { enabled: event.target.checked })
                        }
                        className="size-4 rounded-sm border border-border-gray accent-dark-charcoal"
                      />
                      <span className="tabular-nums">
                        {SUPPORT_DAY_LABELS[day].slice(0, 3)}
                      </span>
                    </label>
                    <div
                      className={cn(
                        "grid grid-cols-[1fr_auto_1fr] items-center gap-1.5",
                        !row.enabled && "pointer-events-none opacity-40",
                      )}
                    >
                      <Select
                        aria-label={`${SUPPORT_DAY_LABELS[day]} open time`}
                        value={String(row.openHour)}
                        disabled={!row.enabled}
                        className="h-9 text-xs"
                        onChange={(event) =>
                          updateDay(day, {
                            openHour: Number(event.target.value),
                          })
                        }
                        options={SUPPORT_HOUR_OPTIONS}
                      />
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-medium-gray">
                        to
                      </span>
                      <Select
                        aria-label={`${SUPPORT_DAY_LABELS[day]} close time`}
                        value={String(row.closeHour)}
                        disabled={!row.enabled}
                        className="h-9 text-xs"
                        onChange={(event) =>
                          updateDay(day, {
                            closeHour: Number(event.target.value),
                          })
                        }
                        options={SUPPORT_CLOSE_HOUR_OPTIONS.filter(
                          (option) => Number(option.value) > row.openHour,
                        )}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-medium-gray">
            Greeting
          </p>
          <Textarea
            value={greeting}
            onChange={(event) => setGreeting(event.target.value)}
            rows={3}
            hint="First agent message when a visitor opens chat."
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-gray pt-4">
          <p className="text-xs text-medium-gray">
            {dirty ? "Unsaved changes" : "All changes saved"}
          </p>
          <Button
            type="button"
            disabled={pending || !dirty}
            onClick={handleSave}
          >
            {pending ? "Saving…" : "Save chat settings"}
          </Button>
        </div>
      </div>
    </section>
  );
}
