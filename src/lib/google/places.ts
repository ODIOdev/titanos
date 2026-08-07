/** Google Places (New) helpers for admin address autocomplete. */

export function getGooglePlacesApiKey() {
  return (
    process.env.GOOGLE_PLACES_API_KEY?.trim() ||
    process.env.GOOGLE_MAPS_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
    ""
  );
}

export function isGooglePlacesConfigured() {
  return Boolean(getGooglePlacesApiKey());
}

export type PlacesSuggestion = {
  placeId: string;
  primaryText: string;
  secondaryText: string;
  description: string;
};

export type ParsedPlaceAddress = {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  formatted: string;
};

type AutocompleteResponse = {
  suggestions?: Array<{
    placePrediction?: {
      placeId?: string;
      text?: { text?: string };
      structuredFormat?: {
        mainText?: { text?: string };
        secondaryText?: { text?: string };
      };
    };
  }>;
  error?: { message?: string };
};

type PlaceDetailsResponse = {
  formattedAddress?: string;
  addressComponents?: Array<{
    longText?: string;
    shortText?: string;
    types?: string[];
  }>;
  error?: { message?: string };
};

function componentOf(
  components: PlaceDetailsResponse["addressComponents"],
  type: string,
  short = false,
) {
  const match = components?.find((c) => c.types?.includes(type));
  if (!match) return "";
  return (short ? match.shortText : match.longText) || match.longText || "";
}

export async function autocompletePlaces(
  input: string,
): Promise<PlacesSuggestion[]> {
  const apiKey = getGooglePlacesApiKey();
  if (!apiKey) {
    throw new Error(
      "Google Places is not configured. Set GOOGLE_PLACES_API_KEY.",
    );
  }
  const query = input.trim();
  if (query.length < 2) return [];

  const response = await fetch(
    "https://places.googleapis.com/v1/places:autocomplete",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
      },
      body: JSON.stringify({
        input: query,
        includedRegionCodes: ["us"],
        // Broad address / place lookup (street, buildings, PO boxes, etc.)
        includedPrimaryTypes: [
          "street_address",
          "premise",
          "subpremise",
          "route",
          "postal_code",
        ],
      }),
      cache: "no-store",
    },
  );

  const data = (await response.json()) as AutocompleteResponse;
  if (!response.ok) {
    throw new Error(
      data.error?.message || `Places autocomplete failed (${response.status})`,
    );
  }

  return (data.suggestions ?? [])
    .map((row) => {
      const prediction = row.placePrediction;
      if (!prediction?.placeId) return null;
      const primary =
        prediction.structuredFormat?.mainText?.text ||
        prediction.text?.text ||
        "";
      const secondary =
        prediction.structuredFormat?.secondaryText?.text || "";
      return {
        placeId: prediction.placeId,
        primaryText: primary,
        secondaryText: secondary,
        description: [primary, secondary].filter(Boolean).join(", "),
      } satisfies PlacesSuggestion;
    })
    .filter((row): row is PlacesSuggestion => Boolean(row));
}

export async function getPlaceAddress(
  placeId: string,
): Promise<ParsedPlaceAddress> {
  const apiKey = getGooglePlacesApiKey();
  if (!apiKey) {
    throw new Error(
      "Google Places is not configured. Set GOOGLE_PLACES_API_KEY.",
    );
  }
  const id = placeId.trim();
  if (!id) throw new Error("Missing place id.");

  const response = await fetch(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(id)}`,
    {
      method: "GET",
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "formattedAddress,addressComponents",
      },
      cache: "no-store",
    },
  );

  const data = (await response.json()) as PlaceDetailsResponse;
  if (!response.ok) {
    throw new Error(
      data.error?.message || `Place details failed (${response.status})`,
    );
  }

  const streetNumber = componentOf(data.addressComponents, "street_number");
  const route = componentOf(data.addressComponents, "route");
  const line1 = [streetNumber, route].filter(Boolean).join(" ").trim();
  const line2 =
    componentOf(data.addressComponents, "subpremise") ||
    componentOf(data.addressComponents, "apartment") ||
    "";
  const city =
    componentOf(data.addressComponents, "locality") ||
    componentOf(data.addressComponents, "postal_town") ||
    componentOf(data.addressComponents, "sublocality") ||
    componentOf(data.addressComponents, "administrative_area_level_3");
  const state = componentOf(
    data.addressComponents,
    "administrative_area_level_1",
    true,
  );
  const postalCode = componentOf(data.addressComponents, "postal_code");
  const country = componentOf(data.addressComponents, "country", true) || "US";

  return {
    line1: line1 || data.formattedAddress?.split(",")[0]?.trim() || "",
    line2,
    city,
    state,
    postalCode,
    country,
    formatted: data.formattedAddress || "",
  };
}
