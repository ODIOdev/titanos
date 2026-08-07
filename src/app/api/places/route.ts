import { NextResponse } from "next/server";
import {
  autocompletePlaces,
  getPlaceAddress,
  isGooglePlacesConfigured,
} from "@/lib/google/places";

/**
 * Storefront Places autocomplete for checkout shipping address.
 * GET ?q=… → suggestions; GET ?placeId=… → parsed address.
 */
export async function GET(request: Request) {
  if (!isGooglePlacesConfigured()) {
    return NextResponse.json(
      {
        error:
          "Google Places is not configured. Add GOOGLE_PLACES_API_KEY to the environment.",
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
