import { SiteHeader } from "@/components/layout/site-header";
import { Footer } from "@/components/layout/footer";
import {
  MaintenanceAdminBanner,
  MaintenanceScreen,
} from "@/components/layout/maintenance-screen";
import { SupportChatLazy } from "@/components/support/support-chat-lazy";
import { getIsMasterAdmin } from "@/lib/auth/session";
import { getMaintenanceSettings } from "@/lib/data/maintenance";
import { getSupportChatSettings } from "@/lib/data/support-chat-settings";

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [maintenance, supportChat] = await Promise.all([
    getMaintenanceSettings(),
    getSupportChatSettings(),
  ]);
  // Only pay for the auth lookup while the site is actually offline.
  const adminPreview = maintenance.enabled ? await getIsMasterAdmin() : false;

  if (maintenance.enabled && !adminPreview) {
    return <MaintenanceScreen settings={maintenance} />;
  }

  return (
    <div className="storefront-stage">
      <div className="storefront-site @container flex min-h-screen flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-titan-yellow focus:px-4 focus:py-2 focus:font-heading focus:text-sm focus:font-semibold focus:uppercase focus:text-dark-charcoal"
        >
          Skip to main content
        </a>
        {adminPreview ? <MaintenanceAdminBanner /> : null}
        <SiteHeader />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
        <SupportChatLazy settings={supportChat} />
      </div>
    </div>
  );
}
