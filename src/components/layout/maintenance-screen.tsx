import Image from "next/image";
import Link from "next/link";
import { Mail, Phone, Wrench } from "lucide-react";
import { SITE_CONFIG } from "@/lib/data/seed-data";
import type { MaintenanceSettings } from "@/lib/data/maintenance";

/** Reminder for admins, who keep seeing the real store while it is offline. */
export function MaintenanceAdminBanner() {
  return (
    <div className="bg-warning-orange px-4 py-2 text-center text-sm font-medium text-near-black">
      <Wrench className="mr-1.5 inline size-4 align-text-bottom" aria-hidden="true" />
      Maintenance mode is on. Visitors see the maintenance page — you see the
      live store because you are an admin.{" "}
      <Link href="/admin/settings" className="font-semibold underline">
        Bring the site back online
      </Link>
    </div>
  );
}

/** Standalone page shown to visitors while the storefront is offline. */
export function MaintenanceScreen({
  settings,
}: {
  settings: MaintenanceSettings;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-near-black">
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl text-center">
          <Image
            src="/images/logo/logo-landscape-dark.png"
            alt={SITE_CONFIG.name}
            width={1470}
            height={500}
            className="mx-auto h-auto w-[min(100%,18rem)] object-contain sm:w-[22rem]"
            priority
            unoptimized
          />

          <span className="mt-10 inline-flex items-center gap-2 border border-titan-yellow/40 bg-titan-yellow/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-titan-yellow">
            <Wrench className="size-3.5" aria-hidden="true" />
            Under maintenance
          </span>

          <h1 className="mt-5 font-heading text-3xl uppercase leading-tight text-white sm:text-4xl">
            {settings.headline}
          </h1>

          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-white/70">
            {settings.message}
          </p>

          <div className="mx-auto mt-10 grid max-w-md gap-3 sm:grid-cols-2">
            <a
              href={`tel:${SITE_CONFIG.phone.replace(/[^\d+]/g, "")}`}
              className="flex items-center justify-center gap-2 bg-titan-yellow px-4 py-3 font-heading text-sm font-semibold uppercase tracking-wide text-near-black transition-colors hover:bg-titan-yellow/90"
            >
              <Phone className="size-4" aria-hidden="true" />
              {SITE_CONFIG.phone}
            </a>
            <a
              href={`mailto:${SITE_CONFIG.supportEmail}`}
              className="flex items-center justify-center gap-2 border border-white/25 px-4 py-3 font-heading text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:border-white/60"
            >
              <Mail className="size-4" aria-hidden="true" />
              Email us
            </a>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10 py-6 text-center text-xs text-white/40">
        © {new Date().getFullYear()} {SITE_CONFIG.name}. All rights reserved.
      </footer>
    </div>
  );
}
