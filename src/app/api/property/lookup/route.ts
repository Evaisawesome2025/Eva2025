import { NextResponse } from "next/server";
import { getPropertyDetail } from "@/services/attomService";
import { getValueEstimate, getComparables } from "@/services/rentcastService";
import { DEFAULT_MARKET_PPSF } from "@/lib/instant-analysis";

export const dynamic = "force-dynamic";

/**
 * GET /api/property/lookup?address=...
 *
 * Returns the subject facts the instant analyzer needs — square footage and a
 * market price-per-sqft (from comps / AVM) — using approved data providers
 * when their keys are configured. With no keys it returns a labeled default
 * $/sqft so the estimator still works, flagged hasData:false.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = (searchParams.get("address") ?? "").trim();
  if (!address) {
    return NextResponse.json({ error: "address is required" }, { status: 400 });
  }

  let sqft: number | null = null;
  let beds: number | null = null;
  let baths: number | null = null;
  let compPpsf: number | null = null;
  let avm: number | null = null;
  const sources: string[] = [];

  // Subject structural details (ATTOM).
  try {
    const detail = await getPropertyDetail(address, "");
    if (detail) {
      sqft = detail.sqft;
      beds = detail.beds;
      baths = detail.baths;
      sources.push("attom");
    }
  } catch (e) {
    console.error("[lookup attom]", e);
  }

  // Comps → median price per square foot (RentCast).
  try {
    const comps = await getComparables(address);
    const ppsfs = comps
      .filter((c) => (c.salePrice ?? 0) > 0 && (c.sqft ?? 0) > 0)
      .map((c) => c.salePrice! / c.sqft!)
      .sort((a, b) => a - b);
    if (ppsfs.length > 0) {
      compPpsf = Math.round(ppsfs[Math.floor(ppsfs.length / 2)]);
      sources.push("rentcast_comps");
    }
  } catch (e) {
    console.error("[lookup comps]", e);
  }

  // AVM as an ARV sanity check / fallback (RentCast).
  try {
    const est = await getValueEstimate(address);
    if (est?.price) {
      avm = est.price;
      sources.push("rentcast_avm");
      // If we have sqft but no comp ppsf, derive it from the AVM.
      if (!compPpsf && sqft) compPpsf = Math.round(est.price / sqft);
    }
  } catch (e) {
    console.error("[lookup avm]", e);
  }

  const hasData = sources.length > 0;

  return NextResponse.json({
    hasData,
    sqft,
    beds,
    baths,
    avm,
    // Always hand back a usable $/sqft so the estimator works with no keys.
    marketPpsf: compPpsf ?? DEFAULT_MARKET_PPSF,
    marketPpsfIsDefault: compPpsf == null,
    sources,
  });
}
