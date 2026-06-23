import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/address/suggest?q=...
 *
 * Keyless address autocomplete so the app works out of the box — no Google API
 * key required. Uses the U.S. Census Bureau geocoder (a public government API,
 * ToS-friendly, no scraping). When a Google key is configured, the client uses
 * Google Places directly for richer incremental results; this is the fallback.
 */
const CENSUS_URL =
  "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress";

export interface AddressSuggestion {
  formattedAddress: string;
  placeId: string;
  latitude: number | null;
  longitude: number | null;
  street?: string;
  city: string;
  state: string;
  zip: string;
  county: string;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();

  // Need a few characters before a geocode is meaningful.
  if (q.length < 5) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const url = `${CENSUS_URL}?address=${encodeURIComponent(
      q
    )}&benchmark=Public_AR_Current&format=json`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return NextResponse.json({ suggestions: [] });
    const data = await res.json();

    const matches: any[] = data?.result?.addressMatches ?? [];
    const suggestions: AddressSuggestion[] = matches
      .slice(0, 6)
      .map((m) => {
        const c = m.addressComponents ?? {};
        const street = [c.fromAddress, c.streetName, c.suffixType]
          .filter(Boolean)
          .join(" ");
        return {
          formattedAddress: m.matchedAddress ?? "",
          placeId: "",
          latitude: m.coordinates?.y ?? null,
          longitude: m.coordinates?.x ?? null,
          street: street || undefined,
          city: c.city ?? "",
          state: c.state ?? "",
          zip: c.zip ?? "",
          county: "",
        };
      })
      .filter((s) => s.formattedAddress);

    return NextResponse.json({ suggestions });
  } catch (err) {
    console.error("[/api/address/suggest]", err);
    return NextResponse.json({ suggestions: [] });
  }
}
