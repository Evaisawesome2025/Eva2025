import type { AnalysisInputs, AnalysisResult, Verdict } from "@/lib/types";

/**
 * dealScoringService
 * ------------------
 * Pure, dependency-free flip math. No network, no DB — easy to unit test and
 * reuse on both client and server.
 */

/** The classic "70% rule" multiplier used for the max offer. */
export const ARV_RULE_MULTIPLIER = 0.7;

/**
 * Max allowable offer using the 70% rule:
 *   maxOffer = ARV * 0.70 - repairs
 */
export function calculateMaxOffer(arv: number, repairs: number): number {
  return round(arv * ARV_RULE_MULTIPLIER - repairs);
}

/**
 * Estimated profit:
 *   profit = ARV - purchasePrice - repairs - holdingCosts - sellingCosts - closingCosts
 *
 * - holdingCosts  = financingCost * holdingMonths (financingCost is a monthly carry)
 * - sellingCosts  = ARV * sellingCostPct / 100
 */
export function calculateEstimatedProfit(inputs: AnalysisInputs): number {
  const {
    estimatedArv,
    purchasePrice,
    estimatedRepairs,
    holdingMonths,
    financingCost,
    sellingCostPct,
    closingCostEstimate,
  } = inputs;

  const holdingCosts = (financingCost || 0) * (holdingMonths || 0);
  const sellingCosts = (estimatedArv || 0) * ((sellingCostPct || 0) / 100);

  return round(
    (estimatedArv || 0) -
      (purchasePrice || 0) -
      (estimatedRepairs || 0) -
      holdingCosts -
      sellingCosts -
      (closingCostEstimate || 0)
  );
}

/** Total cash the investor has tied up (used for ROI). */
export function calculateTotalInvested(inputs: AnalysisInputs): number {
  const holdingCosts = (inputs.financingCost || 0) * (inputs.holdingMonths || 0);
  return round(
    (inputs.purchasePrice || 0) +
      (inputs.estimatedRepairs || 0) +
      holdingCosts +
      (inputs.closingCostEstimate || 0)
  );
}

/**
 * Flip score from 0–100. Blends three signals an investor cares about:
 *   1. ROI on cash invested (most weight)
 *   2. Profit margin vs. ARV
 *   3. How far the purchase price sits below the 70%-rule max offer (the "cushion")
 */
export function calculateFlipScore(inputs: AnalysisInputs): number {
  const profit = calculateEstimatedProfit(inputs);
  const invested = calculateTotalInvested(inputs);
  const maxOffer = calculateMaxOffer(inputs.estimatedArv, inputs.estimatedRepairs);

  // 1. ROI component — 30%+ cash-on-cash maxes this out.
  const roi = invested > 0 ? profit / invested : 0;
  const roiScore = clamp01(roi / 0.3) * 45;

  // 2. Margin component — 25%+ profit-to-ARV maxes this out.
  const margin = inputs.estimatedArv > 0 ? profit / inputs.estimatedArv : 0;
  const marginScore = clamp01(margin / 0.25) * 35;

  // 3. Cushion component — buying at/under the max offer is ideal.
  //    cushion = how far below max offer you're buying, relative to max offer.
  const cushion =
    maxOffer > 0 ? (maxOffer - inputs.purchasePrice) / maxOffer : 0;
  const cushionScore = clamp01((cushion + 0.05) / 0.2) * 20;

  const raw = roiScore + marginScore + cushionScore;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

/** Green / yellow / red verdict derived from the flip score. */
export function scoreToVerdict(score: number): Verdict {
  if (score >= 70) return "green";
  if (score >= 45) return "yellow";
  return "red";
}

/** Run the full underwrite and return every computed field. */
export function analyzeDeal(inputs: AnalysisInputs): AnalysisResult {
  const maxOffer = calculateMaxOffer(inputs.estimatedArv, inputs.estimatedRepairs);
  const estimatedProfit = calculateEstimatedProfit(inputs);
  const invested = calculateTotalInvested(inputs);
  const roiPercent = invested > 0 ? (estimatedProfit / invested) * 100 : 0;
  const flipScore = calculateFlipScore(inputs);
  const verdict = scoreToVerdict(flipScore);

  return {
    maxOffer,
    estimatedProfit,
    roiPercent: round(roiPercent),
    flipScore,
    verdict,
  };
}

// --- helpers ---
function round(n: number): number {
  return Math.round(n * 100) / 100;
}
function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
