import { redirect } from "next/navigation";
import { MaintenanceScreen } from "@/components/layout/maintenance-screen";
import { getIsMasterAdmin } from "@/lib/auth/session";
import { getMaintenanceSettings } from "@/lib/data/maintenance";

export const metadata = {
  title: "Maintenance page preview",
  robots: { index: false, follow: false },
};

/**
 * Admin-only preview of the visitor maintenance UI.
 * Does not take the storefront offline — opens outside the admin chrome.
 */
export default async function MaintenancePreviewPage() {
  const isAdmin = await getIsMasterAdmin();
  if (!isAdmin) {
    redirect("/login?redirect=/maintenance-preview");
  }

  const settings = await getMaintenanceSettings();

  return (
    <MaintenanceScreen
      settings={{
        ...settings,
        enabled: true,
      }}
    />
  );
}
