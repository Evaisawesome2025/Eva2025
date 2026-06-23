/**
 * countyDataService
 * -----------------
 * Our own keyless property-data reader built on **public county GIS open data**
 * (ArcGIS REST). For Sioux Falls these are the Minnehaha County and Lincoln
 * County parcel services — government open data, explicitly meant for
 * programmatic access. No paid API, no scraping.
 *
 * Different counties name their fields differently, so the field mapping is
 * env-configurable. Point COUNTY_GIS_PARCELS_URL at a queryable layer, e.g.:
 *   https://gis.minnehahacounty.org/minnemap/rest/services/Parcels/MapServer/0
 * and set the *_FIELD vars to that layer's attribute names (inspect the layer
 * with `?f=json` to see them).
 */

export interface CountyParcel {
  parcelId: string | null;
  ownerName: string | null;
  sqft: number | null;
  yearBuilt: number | null;
  assessedValue: number | null;
  lastSalePrice: number | null;
  lastSaleDate: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface CountyComp {
  formattedAddress: string;
  salePrice: number | null;
  saleDate: string | null;
  sqft: number | null;
  distanceMiles: number | null;
}

interface FieldMap {
  address: string;
  parcelId: string;
  owner: string;
  sqft: string;
  yearBuilt: string;
  assessedValue: string;
  salePrice: string;
  saleDate: string;
}

function getConfig() {
  const f: FieldMap = {
    address: process.env.COUNTY_GIS_ADDRESS_FIELD || "SiteAddress",
    parcelId: process.env.COUNTY_GIS_PARCELID_FIELD || "ParcelID",
    owner: process.env.COUNTY_GIS_OWNER_FIELD || "Owner",
    sqft: process.env.COUNTY_GIS_SQFT_FIELD || "BuildingSqFt",
    yearBuilt: process.env.COUNTY_GIS_YEARBUILT_FIELD || "YearBuilt",
    assessedValue: process.env.COUNTY_GIS_ASSESSEDVALUE_FIELD || "TotalValue",
    salePrice: process.env.COUNTY_GIS_SALEPRICE_FIELD || "SalePrice",
    saleDate: process.env.COUNTY_GIS_SALEDATE_FIELD || "SaleDate",
  };
  return {
    url: process.env.COUNTY_GIS_PARCELS_URL || null,
    token: process.env.COUNTY_GIS_API_KEY || null,
    fields: f,
  };
}

function num(v: unknown): number | null {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : null;
}

/** Escape single quotes for an ArcGIS SQL `where` clause. */
function esc(s: string): string {
  return s.replace(/'/g, "''");
}

async function arcgisQuery(
  url: string,
  params: Record<string, string>,
  token: string | null
): Promise<any | null> {
  const qs = new URLSearchParams({ f: "json", ...params });
  if (token) qs.set("token", token);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const res = await fetch(`${url}/query?${qs.toString()}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("[countyDataService] query failed:", err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/** Look up a parcel by street address. */
export async function getParcelByAddress(
  address: string
): Promise<CountyParcel | null> {
  const { url, token, fields } = getConfig();
  if (!url) {
    console.warn("[countyDataService] COUNTY_GIS_PARCELS_URL not set — skipping.");
    return null;
  }
  // Match on the street portion (before the first comma) for resilience.
  const street = esc(address.split(",")[0].trim());
  const data = await arcgisQuery(
    url,
    {
      where: `UPPER(${fields.address}) LIKE UPPER('%${street}%')`,
      outFields: "*",
      returnGeometry: "true",
      outSR: "4326",
      resultRecordCount: "1",
    },
    token
  );
  const feature = data?.features?.[0];
  if (!feature) return null;
  const a = feature.attributes ?? {};
  const g = feature.geometry ?? {};

  return {
    parcelId: a[fields.parcelId] ?? null,
    ownerName: a[fields.owner] ?? null,
    sqft: num(a[fields.sqft]),
    yearBuilt: num(a[fields.yearBuilt]),
    assessedValue: num(a[fields.assessedValue]),
    lastSalePrice: num(a[fields.salePrice]),
    lastSaleDate: a[fields.saleDate] ? String(a[fields.saleDate]) : null,
    latitude: num(g.y),
    longitude: num(g.x),
  };
}

/**
 * Recent nearby sales for comps, pulled from the same parcel layer when it
 * carries sale price/date. Spatial filter is a bounding box around the point.
 */
export async function getNearbyComps(
  latitude: number,
  longitude: number,
  radiusMiles = 1
): Promise<CountyComp[]> {
  const { url, token, fields } = getConfig();
  if (!url || latitude == null || longitude == null) return [];

  const dLat = radiusMiles / 69; // ~69 miles per degree latitude
  const dLng = radiusMiles / (69 * Math.cos((latitude * Math.PI) / 180));
  const envelope = {
    xmin: longitude - dLng,
    ymin: latitude - dLat,
    xmax: longitude + dLng,
    ymax: latitude + dLat,
    spatialReference: { wkid: 4326 },
  };

  const data = await arcgisQuery(
    url,
    {
      where: `${fields.salePrice} > 0`,
      geometry: JSON.stringify(envelope),
      geometryType: "esriGeometryEnvelope",
      inSR: "4326",
      spatialRel: "esriSpatialRelIntersects",
      outFields: `${fields.address},${fields.salePrice},${fields.saleDate},${fields.sqft}`,
      returnGeometry: "true",
      outSR: "4326",
      resultRecordCount: "25",
    },
    token
  );

  const features: any[] = data?.features ?? [];
  return features.map((f) => {
    const a = f.attributes ?? {};
    const g = f.geometry ?? {};
    const dist =
      g.y != null && g.x != null
        ? haversineMiles(latitude, longitude, g.y, g.x)
        : null;
    return {
      formattedAddress: a[fields.address] ?? "",
      salePrice: num(a[fields.salePrice]),
      saleDate: a[fields.saleDate] ? String(a[fields.saleDate]) : null,
      sqft: num(a[fields.sqft]),
      distanceMiles: dist != null ? Math.round(dist * 100) / 100 : null,
    };
  });
}

function haversineMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
