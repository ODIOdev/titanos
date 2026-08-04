import Image from "next/image";
import Link from "next/link";
import { SITE_CONFIG } from "@/lib/data/seed-data";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-light-gray">
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:py-12">
        <Link
          href="/"
          className="mb-8 inline-flex items-center justify-center sm:mb-10"
          aria-label={SITE_CONFIG.name}
        >
          <Image
            src="/images/logo/logo-landscape-auth.png"
            alt={SITE_CONFIG.name}
            width={1470}
            height={500}
            className="h-auto w-[min(100%,20rem)] object-contain sm:w-[24rem] lg:w-[28rem]"
            priority
            unoptimized
          />
        </Link>
        {children}
      </main>
      <footer className="py-6 text-center text-xs text-medium-gray">
        © {new Date().getFullYear()} {SITE_CONFIG.name}
      </footer>
    </div>
  );
}
