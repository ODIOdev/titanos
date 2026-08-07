import { ProfileForm } from "@/components/account/profile-form";
import { ProfileShippingAddressCard } from "@/components/account/profile-shipping-address-card";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { Address } from "@/types";

async function getProfile() {
  if (!isSupabaseConfigured()) {
    return {
      email: "demo@titansafetyco.com",
      firstName: "Demo",
      lastName: "Customer",
      company: "Demo Construction LLC",
      phone: "",
      avatarUrl: null as string | null,
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
        avatarUrl: null as string | null,
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
      avatar_url?: string | null;
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
      avatarUrl:
        row?.avatar_url ??
        (user.user_metadata?.avatar_url as string | undefined) ??
        null,
    };
  } catch {
    return {
      email: "",
      firstName: "",
      lastName: "",
      company: "",
      phone: "",
      avatarUrl: null as string | null,
    };
  }
}

async function getShippingAddresses(): Promise<Address[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .eq("type", "shipping")
      .order("is_default", { ascending: false });

    return (data ?? []) as Address[];
  } catch {
    return [];
  }
}

export default async function ProfilePage() {
  const [profile, addresses] = await Promise.all([
    getProfile(),
    getShippingAddresses(),
  ]);

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold uppercase tracking-wide text-dark-charcoal">
        Profile
      </h1>
      <p className="mt-2 text-sm text-medium-gray">
        Update your photo, contact details, and default shipping address.
      </p>
      <div className="mt-6 grid items-stretch gap-4 lg:grid-cols-2">
        <ProfileForm
          email={profile.email}
          avatarUrl={profile.avatarUrl}
          defaultValues={{
            firstName: profile.firstName,
            lastName: profile.lastName,
            company: profile.company,
            phone: profile.phone,
          }}
        />

        <ProfileShippingAddressCard
          addresses={addresses}
          profile={{
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
