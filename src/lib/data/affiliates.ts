import { isSupabaseConfigured } from "@/lib/supabase/client";
import { AFFILIATE_ELIGIBILITY_ORDERS } from "@/lib/affiliates/program";
import {
  DEFAULT_PROMO_DISCOUNTS,
  getPromoDiscountSettings,
} from "@/lib/data/admin";

export { AFFILIATE_ELIGIBILITY_ORDERS };

export type AffiliateApplicationStatus = "pending" | "approved" | "declined";

export type AffiliateApplicationRecord = {
  id: string;
  status: AffiliateApplicationStatus;
  admin_note: string | null;
  created_at: string;
  reviewed_at: string | null;
};

/** Everything the /affiliates page needs to pick which state to render. */
export type AffiliateProgramState = {
  signedIn: boolean;
  /** Prefill values for the application form. */
  contact: {
    name: string;
    email: string;
    phone: string;
    company: string;
  } | null;
  ordersCount: number;
  eligible: boolean;
  promoCode: string | null;
  discountPercent: number;
  application: AffiliateApplicationRecord | null;
};

function parseStatus(value: unknown): AffiliateApplicationStatus {
  return value === "approved" || value === "declined" ? value : "pending";
}

const SIGNED_OUT: AffiliateProgramState = {
  signedIn: false,
  contact: null,
  ordersCount: 0,
  eligible: false,
  promoCode: null,
  discountPercent: DEFAULT_PROMO_DISCOUNTS.customerPercent,
  application: null,
};

export async function getAffiliateProgramState(): Promise<AffiliateProgramState> {
  const { customerPercent } = await getPromoDiscountSettings();
  const signedOut = { ...SIGNED_OUT, discountPercent: customerPercent };

  if (!isSupabaseConfigured()) return signedOut;

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return signedOut;

    const [profileRes, ordersRes, applicationRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("first_name, last_name, email, phone, company, promo_code")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .neq("status", "cancelled"),
      // Table ships in a later migration; a failure here must not break the page.
      supabase
        .from("affiliate_applications")
        .select("id, status, admin_note, created_at, reviewed_at")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    const profile = profileRes.data;
    const ordersCount = ordersRes.count ?? 0;
    const application = applicationRes.data
      ? {
          id: applicationRes.data.id,
          status: parseStatus(applicationRes.data.status),
          admin_note: applicationRes.data.admin_note,
          created_at: applicationRes.data.created_at,
          reviewed_at: applicationRes.data.reviewed_at,
        }
      : null;

    return {
      signedIn: true,
      contact: {
        name:
          [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
          "",
        email: profile?.email ?? user.email ?? "",
        phone: profile?.phone ?? "",
        company: profile?.company ?? "",
      },
      ordersCount,
      eligible: ordersCount >= AFFILIATE_ELIGIBILITY_ORDERS,
      promoCode: profile?.promo_code ?? null,
      discountPercent: customerPercent,
      application,
    };
  } catch {
    return signedOut;
  }
}
