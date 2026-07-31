import { SiteSettingsFormClient } from "@/components/admin/site-settings-form";
import { CsvImportExportCard } from "@/components/admin/csv-import-export-card";
import { MaintenanceModeCard } from "@/components/admin/maintenance-mode-card";
import { PromoDiscountCard } from "@/components/admin/promo-discount-card";
import { ResetPlatformCard } from "@/components/admin/reset-platform-card";
import { getPromoDiscountSettings, getSiteSettings } from "@/lib/data/admin";
import { getMaintenanceSettings } from "@/lib/data/maintenance";

export default async function AdminSettingsPage() {
  const [settings, promoDiscounts, maintenance] = await Promise.all([
    getSiteSettings(),
    getPromoDiscountSettings(),
    getMaintenanceSettings(),
  ]);

  return (
    <div className="space-y-6">
      <p className="text-sm text-medium-gray">
        Update storefront defaults, promo code discounts, and manage catalog CSV
        import/export.
      </p>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold uppercase tracking-wide text-dark-charcoal">
          Store settings
        </h2>
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,36rem)_minmax(0,1fr)]">
          <div className="space-y-4">
            <SiteSettingsFormClient defaults={settings} />
            <MaintenanceModeCard settings={maintenance} />
          </div>
          <div className="space-y-4">
            <PromoDiscountCard settings={promoDiscounts} />
            <CsvImportExportCard />
            <ResetPlatformCard />
          </div>
        </div>
      </section>
    </div>
  );
}
