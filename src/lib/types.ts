// Shared domain types for Sioux Falls Flip Radar.

/** Structured address captured from Google Places autocomplete. */
export interface SelectedAddress {
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

/** Raw user inputs for a flip analysis. */
export interface AnalysisInputs {
  purchasePrice: number;
  estimatedArv: number;
  estimatedRepairs: number;
  holdingMonths: number;
  financingCost: number;
  sellingCostPct: number;
  closingCostEstimate: number;
}

export type Verdict = "green" | "yellow" | "red";

/** Computed results returned by the deal scoring service. */
export interface AnalysisResult {
  maxOffer: number;
  estimatedProfit: number;
  /** Return on the total cash invested, as a percentage. */
  roiPercent: number;
  flipScore: number;
  verdict: Verdict;
}
