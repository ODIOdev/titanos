import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  autocompletePlaces,
  getPlaceAddress,
  isGooglePlacesConfigured,
} from "@/lib/google/places";
import { isMasterAdmin, isMasterAdminEmail } from "@/lib/utils";

async function requireAdmin() {
  if (!isSupabaseConfigured()) return true; // demo / local without Supabase
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;
    if (isMasterAdminEmail(user.email)) return true;
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_owner, email")
      .eq("id", user.id)
      .maybeSingle();
    return isMasterAdmin(profile);
  } catch {
    return false;
  }
}

/** Autocomplete: GET ?q=…  Details: GET ?placeId=… */
export async function GET(request: Request) {
  const ok = await requireAdmin();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isGooglePlacesConfigured()) {
    return NextResponse.json(
      {
        error:
          "Google Places is not configured. Add GOOGLE_PLACES_API_KEY (or GOOGLE_MAPS_API_KEY) to the environment.",
        configured: false,
        suggestions: [],
      },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const placeId = (searchParams.get("placeId") ?? "").trim();
  const q = (searchParams.get("q") ?? "").trim();

  try {
    if (placeId) {
      const address = await getPlaceAddress(placeId);
      return NextResponse.json({ configured: true, address });
    }

    if (q.length < 2) {
      return NextResponse.json({ configured: true, suggestions: [] });
    }

    const suggestions = await autocompletePlaces(q);
    return NextResponse.json({ configured: true, suggestions });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Google Places request failed.",
        configured: true,
      },
      { status: 502 },
    );
  }
}
