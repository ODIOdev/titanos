import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import { AdminPathHeader } from "@/components/admin/admin-path-header";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { isMasterAdmin, isMasterAdminEmail, MASTER_ADMIN_EMAIL } from "@/lib/utils";

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

async function getAdminUser(): Promise<{ email: string } | null> {
  if (!isSupabaseConfigured()) {
    return { email: "demo-admin@titansafetyco.com" };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    if (isMasterAdminEmail(user.email)) {
      return { email: user.email ?? MASTER_ADMIN_EMAIL };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, email, is_owner")
      .eq("id", user.id)
      .maybeSingle();

    if (!isMasterAdmin(profile)) return null;

    return { email: profile?.email || user.email || "" };
  } catch {
    return null;
  }
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdminUser();

  if (!admin) {
    redirect("/login?redirect=/admin");
  }

  return (
    <div className="admin-shell flex min-h-screen overflow-x-clip bg-light-gray">
      <AdminSidebar />
      {/* clip, not hidden: hidden would make this a scroll container and break sticky children */}
      <div className="flex min-w-0 flex-1 flex-col overflow-x-clip">
        <AdminMobileNav />
        <AdminPathHeader />
        <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
