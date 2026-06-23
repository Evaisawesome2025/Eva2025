import type { AnalysisResult } from "@/lib/types";

/**
 * instant-analysis
 * ----------------
 * Turns a few high-level facts about a property (size, condition, market
 * $/sqft) into the deal inputs an investor would otherwise enter by hand, and
 * gives a plain-language good / maybe / pass recommendation.
 *
 * When an approved data provider (RentCast/ATTOM) is connected, the sqft and
 * market $/sqft auto-fill from real subject data + comps; otherwise sensible
 * Sioux Falls defaults are used and clearly labeled as estimates.
 */

export type Condition = "light" | "medium" | "heavy" | "gut";

/** Typical rehab cost per square foot by condition (Sioux Falls SFR). */
export const REHAB_PER_SQFT: Record<Condition, number> = {
  light: 15,
  medium: 30,
  heavy: 50,
  gut: 75,
};

export const CONDITION_LABELS: Record<Condition, string> = {
  light: "Light — cosmetic (paint, floors)",
  medium: "Moderate — kitchen/baths + systems",
  heavy: "Heavy — most systems + layout",
  gut: "Full gut — down to studs",
};

/** Approximate Sioux Falls median resale price per square foot. */
export const DEFAULT_MARKET_PPSF = 185;

export function estimateArv(pricePerSqft: number, sqft: number): number {
  return Math.round((pricePerSqft || 0) * (sqft || 0));
}

export function estimateRepairs(condition: Condition, sqft: number): number {
  return Math.round((REHAB_PER_SQFT[condition] ?? 0) * (sqft || 0));
}

export type FlipRecommendation = "good" | "maybe" | "pass";

export interface Recommendation {
  rec: FlipRecommendation;
  reason: string;
}

/**
 * Plain-language verdict: is this a good flip at this price?
 * Combines the flip score, profitability, and whether the price respects the
 * max-offer discipline.
 */
export function recommendFlip(
  result: AnalysisResult,
  purchasePrice: number,
  maxOffer: number
): Recommendation {
  if (result.estimatedProfit <= 0) {
    return {
      rec: "pass",
      reason: "No projected profit at this purchase price.",
    };
  }
  if (purchasePrice > maxOffer * 1.1 || result.flipScore < 45) {
    return {
      rec: "pass",
      reason:
        purchasePrice > maxOffer * 1.1
          ? "Price is well above the max offer the numbers support."
          : "Margins are too thin for the risk.",
    };
  }
  if (result.flipScore >= 70 && purchasePrice <= maxOffer) {
    return {
      rec: "good",
      reason: "Strong margin and the price is at or below your max offer.",
    };
  }
  return {
    rec: "maybe",
    reason:
      purchasePrice > maxOffer
        ? "Workable, but you're paying over the max offer — negotiate."
        : "Decent deal — tighten your repair and ARV numbers to be sure.",
  };
}
