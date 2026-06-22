import { NextResponse } from "next/server";
import {
  geocodeByPlaceId,
  geocodeByAddress,
} from "@/services/googleGeocodingService";

/**
 * GET /api/geocode?placeId=... | ?address=...
 * Server-side resolver that fills in county + structured fields for a place.
 * Used as a fallback / enrichment path for the client autocomplete.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const placeId = searchParams.get("placeId");
  const address = searchParams.get("address");

  if (!placeId && !address) {
    return NextResponse.json(
      { error: "placeId or address query param is required" },
      { status: 400 }
    );
  }

  const result = placeId
    ? await geocodeByPlaceId(placeId)
    : await geocodeByAddress(address!);

  if (!result) {
    return NextResponse.json(
      {
        error:
          "Could not geocode. Ensure GOOGLE_GEOCODING_API_KEY is set and the input is valid.",
      },
      { status: 404 }
    );
  }

  return NextResponse.json(result);
}
