import Link from "next/link";
import { SITE_CONFIG } from "@/lib/data/seed-data";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-light-gray">
      <header className="border-b border-border-gray bg-white">
        <div className="container-titan flex h-16 items-center">
          <Link
            href="/"
            className="font-heading text-xl font-semibold uppercase tracking-wide text-dark-charcoal"
          >
            {SITE_CONFIG.name}
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-sm border border-border-gray bg-white p-6 shadow-sm sm:p-8">
          {children}
        </div>
      </main>
      <footer className="py-6 text-center text-xs text-medium-gray">
        © {new Date().getFullYear()} {SITE_CONFIG.name}
      </footer>
    </div>
  );
}
