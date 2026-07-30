import { ProfileForm } from "@/components/account/profile-form";
import { isSupabaseConfigured } from "@/lib/supabase/client";

async function getProfile() {
  if (!isSupabaseConfigured()) {
    return {
      email: "demo@titansafetyco.com",
      firstName: "Demo",
      lastName: "Customer",
      company: "Demo Construction LLC",
      phone: "",
    };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return {
        email: "",
        firstName: "",
        lastName: "",
        company: "",
        phone: "",
      };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    const row = profile as {
      email?: string | null;
      first_name?: string | null;
      last_name?: string | null;
      company?: string | null;
      phone?: string | null;
    } | null;

    return {
      email: row?.email ?? user.email ?? "",
      firstName:
        row?.first_name ??
        (user.user_metadata?.first_name as string | undefined) ??
        "",
      lastName:
        row?.last_name ??
        (user.user_metadata?.last_name as string | undefined) ??
        "",
      company:
        row?.company ??
        (user.user_metadata?.company as string | undefined) ??
        "",
      phone:
        row?.phone ??
        (user.user_metadata?.phone as string | undefined) ??
        "",
    };
  } catch {
    return {
      email: "",
      firstName: "",
      lastName: "",
      company: "",
      phone: "",
    };
  }
}

export default async function ProfilePage() {
  const profile = await getProfile();

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold uppercase tracking-wide text-dark-charcoal">
        Profile
      </h1>
      <p className="mt-2 text-sm text-medium-gray">
        Update your contact details for orders and quotes.
      </p>
      <div className="mt-8 rounded-sm border border-border-gray bg-white p-6">
        <ProfileForm
          email={profile.email}
          defaultValues={{
            firstName: profile.firstName,
            lastName: profile.lastName,
            company: profile.company,
            phone: profile.phone,
          }}
        />
      </div>
    </div>
  );
}
