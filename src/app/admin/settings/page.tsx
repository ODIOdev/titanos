import { SiteSettingsFormClient } from "@/components/admin/site-settings-form";
import { getSiteSettings } from "@/lib/data/admin";

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <div className="space-y-4">
      <p className="text-sm text-medium-gray">
        Update storefront defaults. In demo mode, saves acknowledge without persisting.
      </p>
      <SiteSettingsFormClient defaults={settings} />
    </div>
  );
}
