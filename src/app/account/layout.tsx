import Link from "next/link";
import { redirect } from "next/navigation";
import { logout } from "@/lib/actions/auth";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { SITE_CONFIG } from "@/lib/data/seed-data";
import { Button } from "@/components/ui/button";
import { AccountNav } from "@/components/account/account-nav";

async function getAccountUser() {
  if (!isSupabaseConfigured()) {
    return { user: null, demo: true as const };
  }
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return { user, demo: false as const };
  } catch {
    return { user: null, demo: true as const };
  }
}

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, demo } = await getAccountUser();

  if (!demo && !user) {
    redirect("/login?redirect=/account");
  }

  const displayName =
    (user?.user_metadata?.first_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "Customer";

  return (
    <div className="min-h-screen bg-light-gray">
      <header className="border-b border-border-gray bg-white">
        <div className="container-titan flex h-14 items-center justify-between gap-4">
          <Link
            href="/"
            className="font-heading text-lg font-semibold uppercase tracking-wide text-dark-charcoal"
          >
            {SITE_CONFIG.shortName}
          </Link>
          <div className="flex items-center gap-3 text-sm text-medium-gray">
            <span className="hidden sm:inline">
              {demo ? "Demo account" : `Hi, ${displayName}`}
            </span>
            {!demo ? (
              <form action={logout}>
                <Button type="submit" variant="ghost" size="sm">
                  Sign out
                </Button>
              </form>
            ) : (
              <Link
                href="/login"
                className="text-dark-charcoal underline-offset-2 hover:underline"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="container-titan py-8 lg:py-10">
        {demo ? (
          <div className="mb-6 rounded-sm border border-warning-orange/40 bg-warning-orange/10 px-4 py-3 text-sm text-dark-charcoal">
            Supabase is not configured. Showing demo account views with empty
            states.
          </div>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
          <aside>
            <AccountNav />
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
