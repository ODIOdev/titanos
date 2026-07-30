"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { saveSiteSettings } from "@/lib/actions/admin";
import type { SiteSettingsForm } from "@/lib/data/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SiteSettingsFormClient({
  defaults,
}: {
  defaults: SiteSettingsForm;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="max-w-xl space-y-4 rounded-sm border border-border-gray bg-white p-5"
      action={(formData) => {
        startTransition(async () => {
          const result = await saveSiteSettings(formData);
          if (!result.success) {
            toast.error(result.message);
            return;
          }
          toast.success(result.message);
        });
      }}
    >
      <Input
        label="Site name"
        name="siteName"
        defaultValue={defaults.siteName}
        required
      />
      <Input
        label="Tagline"
        name="tagline"
        defaultValue={defaults.tagline}
      />
      <Input
        label="Support email"
        name="supportEmail"
        type="email"
        defaultValue={defaults.supportEmail}
      />
      <Input label="Phone" name="phone" defaultValue={defaults.phone} />
      <Input
        label="Free shipping threshold"
        name="freeShippingThreshold"
        type="number"
        step="1"
        defaultValue={defaults.freeShippingThreshold}
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save settings"}
      </Button>
    </form>
  );
}
