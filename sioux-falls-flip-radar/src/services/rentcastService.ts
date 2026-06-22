/**
 * rentcastService
 * ---------------
 * Placeholder wrapper for the RentCast API (https://www.rentcast.io/api).
 * RentCast is an *approved*, ToS-compliant data provider — it explicitly
 * permits programmatic access. Add RENTCAST_API_KEY to enable.
 *
 * Nothing here scrapes Zillow / Realtor / Redfin / Facebook Marketplace.
 */

const BASE_URL = "https://api.rentcast.io/v1";

export interface RentcastValueEstimate {
  price: number | null;
  priceRangeLow: number | null;
  priceRangeHigh: number | null;
}

export interface RentcastComp {
  formattedAddress: string;
  salePrice: number | null;
  saleDate: string | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  distanceMiles: number | null;
}

function getApiKey(): string | null {
  return process.env.RENTCAST_API_KEY || null;
}

function headers(apiKey: string): HeadersInit {
  return { "X-Api-Key": apiKey, Accept: "application/json" };
}

/** AVM value estimate for a property. */
export async function getValueEstimate(
  address: string
): Promise<RentcastValueEstimate | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("[rentcastService] RENTCAST_API_KEY not set — skipping.");
    return null;
  }

  // TODO: parse the live response shape once the key is configured.
  const url = `${BASE_URL}/avm/value?address=${encodeURIComponent(address)}`;
  const res = await fetch(url, { headers: headers(apiKey) });
  if (!res.ok) return null;
  const data = await res.json();
  return {
    price: data.price ?? null,
    priceRangeLow: data.priceRangeLow ?? null,
    priceRangeHigh: data.priceRangeHigh ?? null,
  };
}

/** Recent comparable sales near a property. */
export async function getComparables(address: string): Promise<RentcastComp[]> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("[rentcastService] RENTCAST_API_KEY not set — skipping.");
    return [];
  }

  const url = `${BASE_URL}/avm/value?address=${encodeURIComponent(address)}`;
  const res = await fetch(url, { headers: headers(apiKey) });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.comparables ?? []).map((c: any) => ({
    formattedAddress: c.formattedAddress ?? "",
    salePrice: c.price ?? null,
    saleDate: c.saleDate ?? null,
    beds: c.bedrooms ?? null,
    baths: c.bathrooms ?? null,
    sqft: c.squareFootage ?? null,
    distanceMiles: c.distance ?? null,
  }));
}
