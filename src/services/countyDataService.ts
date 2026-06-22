/**
 * countyDataService
 * -----------------
 * Placeholder wrapper for public county GIS / open-data sources. For Sioux
 * Falls these are Minnehaha County and Lincoln County ArcGIS REST services and
 * assessor open-data portals — all *public records*, no scraping required.
 *
 * Configure COUNTY_GIS_BASE_URL (and COUNTY_GIS_API_KEY if the endpoint needs
 * one) to point at the relevant ArcGIS FeatureServer / MapServer query layer.
 */

export interface CountyParcel {
  parcelId: string | null;
  ownerName: string | null;
  assessedValue: number | null;
  landValue: number | null;
  improvementValue: number | null;
  acreage: number | null;
  zoning: string | null;
  legalDescription: string | null;
}

function getConfig() {
  return {
    baseUrl: process.env.COUNTY_GIS_BASE_URL || null,
    apiKey: process.env.COUNTY_GIS_API_KEY || null,
  };
}

/**
 * Look up a parcel by address against a configured county GIS query endpoint.
 * TODO: build the ArcGIS `where`/`outFields` query for your specific layer.
 */
export async function getParcelByAddress(
  address: string
): Promise<CountyParcel | null> {
  const { baseUrl, apiKey } = getConfig();
  if (!baseUrl) {
    console.warn("[countyDataService] COUNTY_GIS_BASE_URL not set — skipping.");
    return null;
  }

  const params = new URLSearchParams({
    where: `SITE_ADDRESS LIKE '%${address}%'`,
    outFields: "*",
    f: "json",
  });
  if (apiKey) params.set("token", apiKey);

  const url = `${baseUrl}/query?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const attrs = data?.features?.[0]?.attributes;
  if (!attrs) return null;

  return {
    parcelId: attrs.PARCEL_ID ?? attrs.PIN ?? null,
    ownerName: attrs.OWNER_NAME ?? null,
    assessedValue: attrs.TOTAL_VALUE ?? null,
    landValue: attrs.LAND_VALUE ?? null,
    improvementValue: attrs.IMPROVEMENT_VALUE ?? null,
    acreage: attrs.ACRES ?? null,
    zoning: attrs.ZONING ?? null,
    legalDescription: attrs.LEGAL_DESC ?? null,
  };
}
