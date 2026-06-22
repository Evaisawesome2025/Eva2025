/**
 * attomService
 * ------------
 * Placeholder wrapper for the ATTOM Data API (https://api.developer.attomdata.com).
 * ATTOM is a licensed/approved property-data provider (assessor, deed, AVM,
 * sales history). Add ATTOM_API_KEY to enable.
 */

const BASE_URL = "https://api.gateway.attomdata.com/propertyapi/v1.0.0";

export interface AttomPropertyDetail {
  attomId: string | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  lotSize: number | null;
  yearBuilt: number | null;
  lastSalePrice: number | null;
  lastSaleDate: string | null;
}

function getApiKey(): string | null {
  return process.env.ATTOM_API_KEY || null;
}

/** Pull assessor / structural details for an address. */
export async function getPropertyDetail(
  address1: string,
  address2: string
): Promise<AttomPropertyDetail | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("[attomService] ATTOM_API_KEY not set — skipping.");
    return null;
  }

  // TODO: map the live ATTOM response once the key is configured.
  const url = `${BASE_URL}/property/detail?address1=${encodeURIComponent(
    address1
  )}&address2=${encodeURIComponent(address2)}`;
  const res = await fetch(url, {
    headers: { apikey: apiKey, Accept: "application/json" },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const p = data?.property?.[0];
  if (!p) return null;

  return {
    attomId: p.identifier?.attomId?.toString() ?? null,
    beds: p.building?.rooms?.beds ?? null,
    baths: p.building?.rooms?.bathstotal ?? null,
    sqft: p.building?.size?.livingsize ?? null,
    lotSize: p.lot?.lotsize1 ?? null,
    yearBuilt: p.summary?.yearbuilt ?? null,
    lastSalePrice: p.sale?.amount?.saleamt ?? null,
    lastSaleDate: p.sale?.salesearchdate ?? null,
  };
}
