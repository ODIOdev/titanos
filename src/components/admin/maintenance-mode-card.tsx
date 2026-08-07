"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, PowerOff, TriangleAlert, Wrench } from "lucide-react";
import { toast } from "sonner";
import { setMaintenanceMode } from "@/lib/actions/admin";
import type { MaintenanceSettings } from "@/lib/data/maintenance";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function MaintenanceModeCard({
  settings,
}: {
  settings: MaintenanceSettings;
}) {
  const router = useRouter();
  const panelId = useId();
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [headline, setHeadline] = useState(settings.headline);
  const [message, setMessage] = useState(settings.message);
  const offline = settings.enabled;
  const [open, setOpen] = useState(offline);

  const copyChanged =
    headline.trim() !== settings.headline || message.trim() !== settings.message;

  function submit(enabled: boolean, successToast?: string) {
    startTransition(async () => {
      const result = await setMaintenanceMode({ enabled, headline, message });
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(successToast ?? result.message);
      setConfirmOpen(false);
      if (enabled) setOpen(true);
      router.refresh();
    });
  }

  return (
    <>
      <section
        className={cn(
          "overflow-hidden rounded-sm border bg-white",
          offline ? "border-red-300" : "border-border-gray",
        )}
      >
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
          className={cn(
            "flex w-full items-start justify-between gap-3 px-5 py-4 text-left transition-colors",
            offline
              ? "bg-red-50/60 hover:bg-red-50"
              : "bg-light-gray/40 hover:bg-light-gray/70",
            open && "border-b border-border-gray",
          )}
        >
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <span
              className={cn(
                "mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-sm",
                offline
                  ? "bg-red-100 text-red-700"
                  : "bg-light-gray text-dark-charcoal",
              )}
            >
              <Wrench className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-heading text-base font-semibold uppercase tracking-wide text-dark-charcoal">
                  Emergency offline
                </h2>
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-sm px-2 py-0.5 text-xs font-semibold uppercase tracking-wide",
                    offline
                      ? "bg-red-100 text-red-800"
                      : "bg-emerald-100 text-emerald-800",
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      offline ? "bg-red-600" : "bg-emerald-600",
                    )}
                    aria-hidden="true"
                  />
                  {offline ? "Offline" : "Live"}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-medium-gray">
                {open
                  ? "Takes the storefront down instantly and shows a maintenance page to every visitor. Admins keep full access."
                  : offline
                    ? "Storefront is offline — expand to restore or edit the maintenance page."
                    : "Collapsed · take the storefront offline when you need emergency downtime."}
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

        <div id={panelId} hidden={!open} className="space-y-4 p-5">
          <div className="space-y-3">
            <Input
              label="Maintenance headline"
              value={headline}
              onChange={(event) => setHeadline(event.target.value)}
              maxLength={80}
            />
            <Textarea
              label="Maintenance message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={3}
              maxLength={400}
              hint="Shown under the headline with your phone and support email."
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {offline ? (
              <Button
                type="button"
                disabled={pending}
                onClick={() => submit(false)}
              >
                {pending ? "Working…" : "Bring site back online"}
              </Button>
            ) : (
              <Button
                type="button"
                variant="danger"
                disabled={pending}
                onClick={() => setConfirmOpen(true)}
              >
                <PowerOff aria-hidden="true" />
                Take site offline
              </Button>
            )}

            <a
              href="/maintenance-preview"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-sm border border-border-gray bg-white px-4 font-heading text-sm font-semibold uppercase tracking-wide text-dark-charcoal transition-[color,background-color,border-color] hover:border-dark-charcoal hover:bg-light-gray"
            >
              Preview page
            </a>

            {copyChanged ? (
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => submit(offline, "Maintenance page copy saved.")}
              >
                Save message
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <Dialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Take the storefront offline?"
        className="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex gap-3 rounded-sm border border-red-200 bg-red-50 px-3 py-3">
            <TriangleAlert
              className="mt-0.5 size-5 shrink-0 text-red-700"
              aria-hidden="true"
            />
            <div className="min-w-0 text-sm text-dark-charcoal">
              <p className="font-semibold text-red-800">
                Shoppers cannot browse, add to cart, or check out.
              </p>
              <p className="mt-1 text-medium-gray">
                Everyone except signed-in admins sees the maintenance page. You
                can bring the site back online from here at any time.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={pending}
              onClick={() => submit(true)}
            >
              {pending ? "Taking offline…" : "Take site offline"}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
