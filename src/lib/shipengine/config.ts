import { SITE_CONFIG } from "@/lib/data/seed-data";
import type { ShipEngineAddress } from "@/lib/shipengine/types";

export const SHIPENGINE_SHIP_FROM_KEY = "shipengine_ship_from";

/** Editable warehouse / origin address for ShipEngine rates & labels. */
export type ShipFromForm = {
  name: string;
  company: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export function defaultShipFromForm(): ShipFromForm {
  return {
    name:
      process.env.SHIPENGINE_SHIP_FROM_NAME?.trim() || SITE_CONFIG.name,
    company:
      process.env.SHIPENGINE_SHIP_FROM_COMPANY?.trim() || SITE_CONFIG.name,
    phone:
      process.env.SHIPENGINE_SHIP_FROM_PHONE?.trim() || SITE_CONFIG.phone,
    line1:
      process.env.SHIPENGINE_SHIP_FROM_LINE1?.trim() ||
      SITE_CONFIG.address.line1,
    line2: process.env.SHIPENGINE_SHIP_FROM_LINE2?.trim() || "",
    city:
      process.env.SHIPENGINE_SHIP_FROM_CITY?.trim() || SITE_CONFIG.address.city,
    state:
      process.env.SHIPENGINE_SHIP_FROM_STATE?.trim() ||
      SITE_CONFIG.address.state,
    postalCode:
      process.env.SHIPENGINE_SHIP_FROM_POSTAL?.trim() ||
      SITE_CONFIG.address.postalCode,
    country:
      process.env.SHIPENGINE_SHIP_FROM_COUNTRY?.trim() ||
      SITE_CONFIG.address.country,
  };
}

export function parseShipFromForm(value: unknown): ShipFromForm | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const line1 = String(row.line1 ?? row.address_line1 ?? "").trim();
  const city = String(row.city ?? row.city_locality ?? "").trim();
  const state = String(row.state ?? row.state_province ?? "").trim();
  const postalCode = String(row.postalCode ?? row.postal_code ?? "").trim();
  if (!line1 && !city && !state && !postalCode) return null;

  const defaults = defaultShipFromForm();
  return {
    name: String(row.name ?? "").trim() || defaults.name,
    company: String(row.company ?? row.company_name ?? "").trim() || defaults.company,
    phone: String(row.phone ?? "").trim() || defaults.phone,
    line1: line1 || defaults.line1,
    line2: String(row.line2 ?? row.address_line2 ?? "").trim(),
    city: city || defaults.city,
    state: state || defaults.state,
    postalCode: postalCode || defaults.postalCode,
    country:
      String(row.country ?? row.country_code ?? "")
        .trim()
        .toUpperCase() || defaults.country,
  };
}

export function shipFromFormToAddress(form: ShipFromForm): ShipEngineAddress {
  return {
    name: form.name.trim() || SITE_CONFIG.name,
    company_name: form.company.trim() || null,
    phone: form.phone.trim() || null,
    address_line1: form.line1.trim(),
    address_line2: form.line2.trim() || null,
    city_locality: form.city.trim(),
    state_province: form.state.trim().toUpperCase(),
    postal_code: form.postalCode.trim(),
    country_code: (form.country.trim() || "US").toUpperCase(),
    address_residential_indicator: "no",
  };
}

/** Sync fallback from env / SITE_CONFIG (no DB). */
export function getShipFromAddress(): ShipEngineAddress {
  return shipFromFormToAddress(defaultShipFromForm());
}

export function isShipEngineDirectConfigured() {
  return Boolean(process.env.SHIPENGINE_API_KEY?.trim());
}

/**
 * Optional pinned ShipEngine carrier account IDs (comma/space separated).
 * When set, rate shopping uses these instead of whatever /carriers returns.
 */
export function getConfiguredCarrierIds(): string[] {
  const raw = process.env.SHIPENGINE_CARRIER_IDS?.trim();
  if (!raw) return [];
  return [
    ...new Set(
      raw
        .split(/[\s,]+/)
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  ];
}

/**
 * Ready when Supabase is configured (edge function path) and/or a direct
 * ShipEngine key is present for local/Vercel fallback.
 */
export function isShipEngineConfigured() {
  const supabaseReady = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  );
  return supabaseReady || isShipEngineDirectConfigured();
}

/** Prefer admin-saved ship-from in site_settings; else env / SITE_CONFIG. */
export async function resolveShipFromAddress(): Promise<ShipEngineAddress> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) {
    return getShipFromAddress();
  }

  try {
    const { isSupabaseConfigured } = await import("@/lib/supabase/client");
    if (!isSupabaseConfigured()) return getShipFromAddress();

    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", SHIPENGINE_SHIP_FROM_KEY)
      .maybeSingle();

    const parsed = parseShipFromForm(data?.value);
    if (parsed?.line1 && parsed.city && parsed.state && parsed.postalCode) {
      return shipFromFormToAddress(parsed);
    }
  } catch {
    // Fall through to env defaults
  }

  return getShipFromAddress();
}
