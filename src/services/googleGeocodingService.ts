import type { SelectedAddress } from "@/lib/types";

/**
 * googleGeocodingService
 * ----------------------
 * Server-side wrapper around the Google Geocoding API. The browser-side address
 * autocomplete (Places) returns a `place_id`; this service resolves the rest of
 * the structured fields we persist (county is only reliably available here).
 *
 * Requires GOOGLE_GEOCODING_API_KEY. This is a placeholder implementation:
 * the live HTTP call is stubbed so the app runs without keys during development.
 */

const GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";

interface GoogleAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

function pickComponent(
  components: GoogleAddressComponent[],
  type: string,
  useShort = false
): string {
  const match = components.find((c) => c.types.includes(type));
  if (!match) return "";
  return useShort ? match.short_name : match.long_name;
}

/** Map a Google geocode result into our SelectedAddress shape. */
function mapResult(result: any): SelectedAddress {
  const components: GoogleAddressComponent[] = result.address_components ?? [];
  const streetNumber = pickComponent(components, "street_number");
  const route = pickComponent(components, "route");

  return {
    formattedAddress: result.formatted_address ?? "",
    placeId: result.place_id ?? "",
    latitude: result.geometry?.location?.lat ?? null,
    longitude: result.geometry?.location?.lng ?? null,
    street: [streetNumber, route].filter(Boolean).join(" ") || undefined,
    city:
      pickComponent(components, "locality") ||
      pickComponent(components, "sublocality") ||
      pickComponent(components, "administrative_area_level_3"),
    state: pickComponent(components, "administrative_area_level_1", true),
    zip: pickComponent(components, "postal_code"),
    // Google returns county as administrative_area_level_2, e.g. "Minnehaha County".
    county: pickComponent(components, "administrative_area_level_2"),
  };
}

/**
 * Resolve a Google `place_id` into a full structured address.
 * TODO: wire up the real fetch once GOOGLE_GEOCODING_API_KEY is configured.
 */
export async function geocodeByPlaceId(
  placeId: string
): Promise<SelectedAddress | null> {
  const apiKey = process.env.GOOGLE_GEOCODING_API_KEY;
  if (!apiKey) {
    console.warn("[googleGeocodingService] GOOGLE_GEOCODING_API_KEY not set.");
    return null;
  }

  const url = `${GEOCODE_URL}?place_id=${encodeURIComponent(
    placeId
  )}&key=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (data.status !== "OK" || !data.results?.length) return null;
  return mapResult(data.results[0]);
}

/** Forward-geocode a raw address string (fallback when no place_id). */
export async function geocodeByAddress(
  address: string
): Promise<SelectedAddress | null> {
  const apiKey = process.env.GOOGLE_GEOCODING_API_KEY;
  if (!apiKey) {
    console.warn("[googleGeocodingService] GOOGLE_GEOCODING_API_KEY not set.");
    return null;
  }

  const url = `${GEOCODE_URL}?address=${encodeURIComponent(
    address
  )}&key=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (data.status !== "OK" || !data.results?.length) return null;
  return mapResult(data.results[0]);
}
